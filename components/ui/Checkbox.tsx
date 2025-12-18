import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/helpers";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string | React.ReactNode;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || 'checkbox';

    return (
      <div className="w-full">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id={checkboxId}
              className={cn(
                "w-4 h-4 text-primary-600 border-gray-300 rounded",
                "focus:ring-2 focus:ring-primary-500",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                error && "border-red-500",
                className
              )}
              ref={ref}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? `${checkboxId}-error` : undefined}
              {...props}
            />
          </div>
          {label && (
            <div className="ml-3 text-sm">
              <label htmlFor={checkboxId} className="text-gray-700">
                {label}
              </label>
            </div>
          )}
        </div>
        {error && (
          <p id={`${checkboxId}-error`} className="mt-1 text-sm text-red-600 ml-7">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
