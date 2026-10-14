import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-md border border-line bg-canvas px-3 text-[15px] text-ink placeholder:text-body/60",
      "focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
