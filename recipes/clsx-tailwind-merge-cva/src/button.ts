import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { cva, type VariantProps } from "class-variance-authority";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buttonVariants = cva("inline-flex items-center rounded-md font-medium", {
  variants: {
    intent: {
      primary: "bg-blue-600 text-white",
      secondary: "bg-gray-100 text-gray-900",
    },
    size: {
      sm: "h-8 px-3 text-sm",
      lg: "h-11 px-6 text-base",
    },
  },
  defaultVariants: { intent: "primary", size: "sm" },
});

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export function buttonClass(props: ButtonVariantProps & { className?: string }) {
  return cn(buttonVariants(props), props.className);
}
