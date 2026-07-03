/**
 * Minimal structured logger — the single seam for application logging and error
 * reporting. Zero dependencies, no external service required.
 *
 * Why this exists: the app previously scattered raw `console.*` calls with no
 * structure and no way to route errors to an alerting service. This centralizes
 * both:
 *   - Output is line-delimited JSON in production (parseable by any log
 *     aggregator) and human-readable in development.
 *   - `setErrorReporter()` attaches an external error tracker (Sentry/Bugsnag/…)
 *     once at startup; every `logger.error` then forwards automatically, so
 *     wiring alerting later needs no changes at the 100+ call sites.
 *
 * Level is controlled by LOG_LEVEL (error|warn|info|debug); defaults to `info`
 * in production, `debug` in development.
 */
type LogLevel = "error" | "warn" | "info" | "debug";

const ORDER: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };

const isProd = process.env.NODE_ENV === "production";
const threshold =
  ORDER[process.env.LOG_LEVEL as LogLevel] ??
  (isProd ? ORDER.info : ORDER.debug);

export type LogContext = Record<string, unknown>;

type ErrorReporter = (error: unknown, context?: LogContext) => void;
let errorReporter: ErrorReporter | null = null;

/**
 * Attach an external error-tracking sink (Sentry/Bugsnag/…) once at startup
 * (e.g. from Next.js `instrumentation.ts`). Every subsequent `logger.error`
 * forwards to it — call sites don't change.
 */
export function setErrorReporter(reporter: ErrorReporter | null): void {
  errorReporter = reporter;
}

function serialize(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return value;
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  if (ORDER[level] > threshold) return;

  const normalized = context
    ? Object.fromEntries(
        Object.entries(context).map(([k, v]) => [k, serialize(v)])
      )
    : undefined;

  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...(normalized ? { context: normalized } : {}),
  };

  const line = isProd
    ? JSON.stringify(entry)
    : `[${level.toUpperCase()}] ${message}${
        normalized ? " " + JSON.stringify(normalized) : ""
      }`;

  // Preserve platform log levels (stderr for error/warn).
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);

  // Forward errors to the external tracker, if one is attached.
  if (level === "error" && errorReporter) {
    try {
      errorReporter(context?.err ?? message, context);
    } catch (reporterError) {
      console.error("errorReporter threw:", reporterError);
    }
  }
}

export const logger = {
  error: (message: string, context?: LogContext) =>
    write("error", message, context),
  warn: (message: string, context?: LogContext) =>
    write("warn", message, context),
  info: (message: string, context?: LogContext) =>
    write("info", message, context),
  debug: (message: string, context?: LogContext) =>
    write("debug", message, context),
};
