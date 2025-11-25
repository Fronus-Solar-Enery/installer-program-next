import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  error?: string | string[];
  className?: string;
}

export function FormError({ error, className = '' }: FormErrorProps) {
  if (!error) return null;

  const errors = Array.isArray(error) ? error : [error];

  return (
    <div className={`text-sm text-red-600 mt-1 flex items-start gap-1 ${className}`}>
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1">
        {errors.map((err, index) => (
          <div key={index}>{err}</div>
        ))}
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  error?: string | string[];
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, required, children, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      <FormError error={error} />
    </div>
  );
}
