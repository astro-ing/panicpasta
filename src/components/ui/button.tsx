import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-1 active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-tomato-500 text-white border-2 border-charcoal-900 shadow-[4px_4px_0px_0px_#1a1816] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1a1816]",
        outline:
          "border-2 border-charcoal-900 bg-transparent text-charcoal-900 shadow-[4px_4px_0px_0px_#1a1816] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1a1816] hover:bg-pasta-100",
        ghost: "hover:bg-pasta-200 text-charcoal-900",
        secondary:
          "bg-basil-400 text-white border-2 border-charcoal-900 shadow-[4px_4px_0px_0px_#1a1816] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1a1816]",
      },
      size: {
        default: "h-12 px-6 py-2 rounded-xl",
        sm: "h-9 px-4 rounded-lg",
        lg: "h-14 px-8 rounded-2xl text-lg",
        icon: "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
