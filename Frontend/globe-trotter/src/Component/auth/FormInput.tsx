import { forwardRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: ReactNode;
  error?: string;
  isPassword?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon, error, isPassword, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-foreground/60 tracking-widest uppercase"
        >
          {label}
        </label>
        <div
          className={[
            "relative flex items-center rounded-lg border bg-white transition-all duration-150",
            error
              ? "border-destructive ring-1 ring-destructive/15"
              : "border-border hover:border-[#1b4f72]/30 focus-within:border-[#1b4f72]/50 focus-within:ring-2 focus-within:ring-[#1b4f72]/10",
          ].join(" ")}
        >
          <span className="pl-3.5 text-muted-foreground/50 flex-shrink-0 flex items-center pointer-events-none">
            {icon}
          </span>
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            className="flex-1 min-w-0 bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="pr-3.5 text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors flex-shrink-0 flex items-center focus:outline-none focus-visible:text-muted-foreground/80"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-destructive leading-tight" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
export default FormInput;
