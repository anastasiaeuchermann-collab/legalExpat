import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/helpers";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-600":
              variant === "primary",
            "bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-600":
              variant === "secondary",
            "border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-gray-600":
              variant === "outline",
            "hover:bg-gray-100 focus-visible:ring-gray-600": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600":
              variant === "destructive",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-base": size === "md",
            "h-12 px-6 text-lg": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
