import { useState } from "react";
import { Input, InputProps } from "./input";
import { Button } from "./button";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  /**
   * Optional placeholder text
   */
  placeholder?: string;
}

/**
 * Password input with toggle to show/hide password
 */
export function PasswordInput({ placeholder = "••••••••", ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="sr-only">
          {showPassword ? "Hide password" : "Show password"}
        </span>
      </Button>
    </div>
  );
}