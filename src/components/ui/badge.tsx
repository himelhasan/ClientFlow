import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#F3D166] text-[#1A1D20] shadow-xs",
        secondary:
          "border-transparent bg-[#F7F4E8] text-[#2B2D32]",
        destructive:
          "border-transparent bg-[#FAD4D6] text-[#9E2A2B]",
        outline: "text-[#1A1D20] border-[#E9E4D3] bg-white",
        success:
          "border-[#C9E9DA] bg-[#E3F4EC] text-[#184E37]",
        warning:
          "border-[#F2E2B6] bg-[#FBF3DC] text-[#5B4712]",
        info:
          "border-[#C4E3F5] bg-[#E2F2FA] text-[#174A67]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
