import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Design system:
// - default: sempre con bordo visibile (anche in dark)
// - outline: già bordato
// - secondary: soft
// - ghost/link: senza border
const buttonVariants = cva(
    [
        "inline-flex items-center justify-center gap-2",
        "whitespace-nowrap rounded-2xl text-sm font-semibold",
        "transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // per tema a CSS vars
        "ring-offset-[rgb(var(--bg))]",
    ].join(" "),
    {
        variants: {
            variant: {
                default: [
                    // ✅ bordo sempre visibile
                    "border border-[rgb(var(--border))]",
                    // ✅ background coerente col tema (card-2) così non sparisce in dark
                    "bg-[rgb(var(--card-2))] text-[rgb(var(--fg))]",
                    // hover: leggero contrasto
                    "hover:bg-[rgb(var(--card))]",
                ].join(" "),
                destructive: [
                    "border border-rose-300/30",
                    "bg-rose-600 text-white",
                    "hover:bg-rose-600/90",
                ].join(" "),
                outline: [
                    "border border-[rgb(var(--border))]",
                    "bg-transparent text-[rgb(var(--fg))]",
                    "hover:bg-[rgb(var(--card-2))]",
                ].join(" "),
                secondary: [
                    "border border-[rgb(var(--border))]",
                    "bg-[rgb(var(--card-2))] text-[rgb(var(--fg))]",
                    "hover:bg-[rgb(var(--card))]",
                ].join(" "),
                ghost: [
                    "border border-transparent",
                    "bg-transparent text-[rgb(var(--fg))]",
                    "hover:bg-[rgb(var(--card-2))]",
                ].join(" "),
                link: "bg-transparent text-[rgb(var(--fg))] underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 px-3",
                lg: "h-11 px-6",
                icon: "h-10 w-10 p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Button = React.forwardRef(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
