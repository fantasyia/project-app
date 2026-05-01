import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "default", ...props }, ref) => {
    
    // Stitch "High-End Editorial" Rules:
    // 0px corner radius, thin borders or solid gold, text uppercase for tertiary/ghost
    const baseClasses = "inline-flex items-center justify-center font-sans tracking-wide uppercase transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none rounded-none"
    
    const sizeClasses = {
      default: "h-12 px-6 text-sm",
      sm: "h-9 px-4 text-xs",
      lg: "h-14 px-8 text-base",
    }
    
    const variantClasses = {
      primary: "bg-brand-500 text-brand-surface-lowest hover:bg-brand-400 shadow-[0_0_40px_rgba(0,168,107,0.15)]",
      secondary: "bg-transparent border border-[rgba(255,255,255,0.15)] text-white hover:border-brand-500 hover:text-brand-500",
      ghost: "bg-transparent text-brand-500 hover:text-brand-400 hover:underline underline-offset-4 decoration-2",
    }
    
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
