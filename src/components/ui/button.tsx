import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C94A] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#F5C94A] text-[#181A1E] hover:bg-[#EBBF3E]",
        destructive:
          "bg-[#FAD4D6] text-[#9E2A2B] hover:bg-[#F5BFC2]",
        outline:
          "border border-[#EAEAEA] bg-white text-[#181A1E] hover:bg-[#F3F1E8]",
        secondary:
          "bg-[#F3F1E8] text-[#262930] hover:bg-[#EAE6D7]",
        ghost: "hover:bg-[#F3F1E8] text-[#262930]",
        link: "text-[#181A1E] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-xl px-3.5 text-xs",
        lg: "h-10 rounded-xl px-6 text-sm",
        icon: "h-9 w-9 rounded-full",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
