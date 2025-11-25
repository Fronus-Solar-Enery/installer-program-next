import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  errors?: Record<string, string[]> | null;
  onClose?: () => void;
  onRetry?: () => void;
}

export function ErrorAlert({ title = 'Error', message, errors, onClose, onRetry }: ErrorAlertProps) {
  return (
    <div className="bg-red-50 border border-destructive/50 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>

          {errors && Object.keys(errors).length > 0 && (
            <div className="mt-3 space-y-2">
              {Object.entries(errors).map(([field, fieldErrors]) => (
                <div key={field} className="text-sm">
                  <span className="font-medium text-red-800 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <ul className="list-disc list-inside ml-2 text-red-700">
                    {fieldErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
            >
              Try Again
            </button>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-red-400 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
