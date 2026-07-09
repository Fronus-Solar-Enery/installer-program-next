"use client";

import * as React from "react";
// Import specific types from Recharts to fix property errors
import * as RechartsPrimitive from "recharts";
import { TooltipProps } from "recharts";
import {
  ValueType,
  NameType,
  Payload,
} from "recharts/types/component/DefaultTooltipContent";
import { LegendPayload } from "recharts/types/component/DefaultLegendContent";

import { cn } from "@/lib/utils";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
          className={cn(
            "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border relative aspect-video w-full min-h-[200px] [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
            className
          )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {mounted && (
          <RechartsPrimitive.ResponsiveContainer width="100%" height="100%" minHeight={200}>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        )}
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  // FIX: Added explicit types to the filter's callback parameters.
  // This helps TypeScript correctly infer that `colorConfig` is an array,
  // resolving potential 'length' or 'filter' property errors on type '{}'.
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]: [string, ChartConfig[string]]) =>
      itemConfig.theme || itemConfig.color
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartTooltipContentProps = TooltipProps<ValueType, NameType> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
    color?: string;
    labelClassName?: string;
  };

function ChartTooltipContent(props: ChartTooltipContentProps) {
  // Extract only the props we need and filter out Recharts-specific ones
  // Access Recharts tooltip properties safely
  const active = (props as { active?: boolean }).active;
  const payload = (props as { payload?: Payload<ValueType, NameType>[] })
    .payload;
  const label = (props as { label?: string }).label;
  const {
    labelFormatter,
    formatter,
    className,
    indicator = "dot",
    hideLabel = false,
    hideIndicator = false,
    labelClassName,
    color,
    nameKey,
    labelKey,
  } = props;

  // Get only standard HTML div props, excluding all Recharts-specific props
  const divProps = Object.keys(props).reduce((acc, key) => {
    // List of props that should NOT be passed to the div element
    const excludedProps = [
      "active",
      "payload",
      "label",
      "labelFormatter",
      "formatter",
      "indicator",
      "hideLabel",
      "hideIndicator",
      "labelClassName",
      "color",
      "nameKey",
      "labelKey",
      // Recharts-specific props
      "accessibilityLayer",
      "wrapperStyle",
      "cursor",
      "allowEscapeViewBox",
      "animationDuration",
      "animationEasing",
      "content",
      "coordinate",
      "filterNull",
      "isAnimationActive",
      "offset",
      "payloadUniqBy",
      "position",
      "reverseDirection",
      "separator",
      "trigger",
      "useTranslate3d",
      "viewBox",
      "axisId",
      "contentStyle",
      "itemSorter",
      "itemStyle",
      "labelStyle",
      // Recharts tooltip props that leak to DOM
      "activeIndex",
      "activePayload",
    ];

    if (!excludedProps.includes(key)) {
      (acc as Record<string, unknown>)[key] = (
        props as Record<string, unknown>
      )[key];
    }
    return acc;
  }, {} as React.HTMLAttributes<HTMLDivElement>);

  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === "string"
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      {...divProps}
      className={cn(
        "border-border/50 bg-background grid min-w-32 items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item: Payload<ValueType, NameType>) => item.type !== "none")
          // FIX: Added explicit types for `item` and `index` parameters in the map function.
          // This resolves the "implicitly has an 'any' type" error.
          .map((item: Payload<ValueType, NameType>, index: number) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color || item.payload.fill || item.color;

            return (
              <div
                key={
                  typeof item.dataKey === "string"
                    ? item.dataKey
                    : `item-${index}`
                }
                className={cn(
                  "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-xs border-(--color-border) bg-(--color-bg)",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent(
  // FIX: Destructured props and used a `...rest` parameter for remaining div attributes.
  // This prevents non-standard HTML attributes like `payload` and `verticalAlign`
  // from being passed to the `div` element, resolving the constraint satisfaction error.
  props: React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "verticalAlign"> & {
      hideIcon?: boolean;
      nameKey?: string;
      // FIX: Explicitly typed `payload` using `LegendPayload` from Recharts.
      payload?: LegendPayload[];
    }
) {
  const {
    className,
    hideIcon = false,
    payload,
    verticalAlign = "bottom",
    nameKey,
    ...rest
  } = props;
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      {...rest}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload
        .filter((item: LegendPayload) => item.type !== "none")
        // FIX: Added explicit type for the `item` parameter to fix 'any' type error.
        .map((item: LegendPayload) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={item.value}
              className={cn(
                "[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-xs"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof (payload as Record<string, unknown>)[key] === "string"
  ) {
    configLabelKey = (payload as Record<string, string>)[key];
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof (payloadPayload as Record<string, unknown>)[key] === "string"
  ) {
    configLabelKey = (payloadPayload as Record<string, string>)[key];
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
