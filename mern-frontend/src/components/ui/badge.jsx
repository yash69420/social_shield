import React from "react";
import { cva } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        safe: "border-transparent bg-green-600 text-white hover:bg-green-700",
        suspicious: "border-transparent bg-red-600 text-white hover:bg-red-700",
        warning:
          "border-transparent bg-yellow-600 text-white hover:bg-yellow-700",
      },
      size: {
        sm: "h-6 px-2 text-xs",
        md: "h-8 px-3 text-sm",
        lg: "h-10 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const Badge = ({
  className,
  variant,
  size,
  icon: Icon,
  children,
  ...props
}) => {
  return (
    <div className={badgeVariants({ variant, size, className })} {...props}>
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {children}
    </div>
  );
};

export { Badge, badgeVariants };
