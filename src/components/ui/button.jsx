import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    [
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
        "transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    ].join(" "),
    {
        variants: {
            variant: {
                // Primary: deterministico (stile “call to action”)
                default:
                    "bg-slate-900 text-white hover:opacity-90 " +
                    "focus-visible:ring-slate-400 focus-visible:ring-offset-[rgb(var(--bg))]",

                destructive:
                    "bg-rose-600 text-white hover:opacity-90 " +
                    "focus-visible:ring-rose-300 focus-visible:ring-offset-[rgb(var(--bg))]",

                outline:
                    "border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] " +
                    "hover:bg-[rgb(var(--card-2))] " +
                    "focus-visible:ring-slate-400 focus-visible:ring-offset-[rgb(var(--bg))]",

                secondary:
                    "bg-[rgb(var(--muted))] text-[rgb(var(--fg))] border border-[rgb(var(--border))] " +
                    "hover:opacity-90 " +
                    "focus-visible:ring-slate-400 focus-visible:ring-offset-[rgb(var(--bg))]",

                ghost:
                    "text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted))] " +
                    "focus-visible:ring-slate-400 focus-visible:ring-offset-[rgb(var(--bg))]",

                link: "text-[rgb(var(--fg))] underline underline-offset-4 hover:opacity-80",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
        <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button, buttonVariants }
