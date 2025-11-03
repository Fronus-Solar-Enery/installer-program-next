import { cn } from "@/lib/utils";
import IconCheck from "./icons/Check";

interface FormStepProps {
  step: number;
  currentStep: number;
  name: string;
  description?: string;
  totalSteps: number;
}

export function FormStep({
  step,
  currentStep,
  name,
  description,
  totalSteps,
}: FormStepProps) {
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;
  const isLast = step === totalSteps - 1;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center group",
        isLast
          ? "flex-1"
          : "flex-1 after:content-[''] after:w-full after:h-[1px] after:absolute after:top-4 after:left-1/2 after:bg-muted"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border text-xs relative z-10 transition-all duration-300",
          isActive &&
            "border-primary backdrop-blur-2xl bg-card/10 text-primary font-semibold",
          isCompleted && "border-primary bg-primary text-primary-foreground",
          !isActive &&
            !isCompleted &&
            "border-muted bg-card/10 backdrop-blur-2xl text-muted-foreground/60"
        )}
      >
        {isCompleted ? (
          <IconCheck  className="h-5 w-5" />
        ) : (
          step + 1
        )}
      </div>
      <div className="mt-2 text-center hidden sm:block">
        <p
          className={cn(
            "text-sm font-medium transition-colors",
            isActive || isCompleted
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {name}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground/80 capitalize hidden sm:block">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
