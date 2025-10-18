import React from "react";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Checkbox } from "./checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "./select";
import { cn } from "@/lib/utils";

export interface IconProps {
  className?: string;
  duotone?: boolean;
  fill?: boolean;
}

interface BaseFieldProps {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  labelClassName?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type: "text" | "number" | "email" | "tel" | "date";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  icon?: React.FC<IconProps>;
  iconPosition?: "left" | "right";
}

interface TextareaFieldProps extends BaseFieldProps {
  type: "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: "select";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  groups?: Array<{
    label: string;
    options: Array<{ value: string; label: string }>;
  }>;
  icon?: React.FC<IconProps>;
  iconPosition?: "left" | "right";
}

interface CheckboxFieldProps extends Omit<BaseFieldProps, "required"> {
  type: "checkbox";
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

type FormFieldProps =
  | InputFieldProps
  | TextareaFieldProps
  | SelectFieldProps
  | CheckboxFieldProps;

export function FormField(props: FormFieldProps) {
  const { label, id, error, hint, className, labelClassName } = props;

  // Set default icon position to left
  const iconPosition =
    props.type !== "checkbox" && "icon" in props && props.icon
      ? props.iconPosition || "left"
      : undefined;

  if (props.type === "checkbox") {
    return (
      <div className={cn("flex items-start space-x-2", className)}>
        <Checkbox
          id={id}
          checked={props.checked}
          onCheckedChange={props.onChange}
        />
        <div className="grid gap-1.5">
          <Label
            htmlFor={id}
            className={cn("cursor-pointer block", labelClassName)}
          >
            {label}
          </Label>
          {props.description && (
            <p className="text-xs text-muted-foreground">{props.description}</p>
          )}
        </div>
      </div>
    );
  }

  // Type guard to exclude checkbox
  const nonCheckboxProps = props as
    | InputFieldProps
    | TextareaFieldProps
    | SelectFieldProps;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className={cn("block", labelClassName)}>
        {label}
        {"required" in nonCheckboxProps && nonCheckboxProps.required && (
          <span className="text-destructive-text text-[10px] ml-1">✱</span>
        )}
      </Label>

      {nonCheckboxProps.type === "textarea" && (
        <Textarea
          id={id}
          value={nonCheckboxProps.value}
          onChange={(e) => nonCheckboxProps.onChange(e.target.value)}
          placeholder={nonCheckboxProps.placeholder}
          disabled={nonCheckboxProps.disabled}
          rows={nonCheckboxProps.rows}
          className={error ? "border-destructive" : ""}
        />
      )}

      {nonCheckboxProps.type === "select" && (
        <div className="relative">
          {nonCheckboxProps.icon && iconPosition === "left" && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <nonCheckboxProps.icon
                className="size-4.5 text-muted-foreground"
                duotone={false}
              />
            </div>
          )}
          <Select
            value={nonCheckboxProps.value}
            onValueChange={nonCheckboxProps.onChange}
          >
            <SelectTrigger
              id={id}
              disabled={nonCheckboxProps.disabled}
              className={cn(
                nonCheckboxProps.icon && iconPosition === "left" && "pl-10",
                nonCheckboxProps.icon && iconPosition === "right" && "pr-10"
              )}
            >
              <SelectValue placeholder={nonCheckboxProps.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {nonCheckboxProps.groups
                ? nonCheckboxProps.groups.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))
                : nonCheckboxProps.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
          {nonCheckboxProps.icon && iconPosition === "right" && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
              <nonCheckboxProps.icon
                className="h-4 w-4 text-muted-foreground"
                duotone={false}
              />
            </div>
          )}
        </div>
      )}

      {nonCheckboxProps.type !== "textarea" &&
        nonCheckboxProps.type !== "select" && (
          <div className="relative">
            {nonCheckboxProps.icon && iconPosition === "left" && (
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <nonCheckboxProps.icon
                  className="h-4.5 w-4.5 text-muted-foreground"
                  duotone={false}
                />
              </div>
            )}
            <Input
              id={id}
              type={nonCheckboxProps.type}
              value={nonCheckboxProps.value}
              onChange={(e) => nonCheckboxProps.onChange(e.target.value)}
              placeholder={nonCheckboxProps.placeholder}
              disabled={nonCheckboxProps.disabled}
              maxLength={nonCheckboxProps.maxLength}
              className={cn(
                error ? "border-destructive" : "",
                nonCheckboxProps.icon && iconPosition === "left" && "pl-10",
                nonCheckboxProps.icon && iconPosition === "right" && "pr-10"
              )}
            />
            {nonCheckboxProps.icon && iconPosition === "right" && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <nonCheckboxProps.icon
                  className="h-4 w-4 text-muted-foreground"
                  duotone={false}
                />
              </div>
            )}
          </div>
        )}

      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-sm text-destructive-text">{error}</p>}
    </div>
  );
}
