"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Context to share state between Trigger and Content
const DialogContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
} | null>(null)

const useDialog = () => {
    const context = React.useContext(DialogContext)
    if (!context) {
        throw new Error("useDialog must be used within a Dialog")
    }
    return context
}

const Dialog = ({
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    children
}: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode
}) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen
    const onOpenChange = isControlled ? controlledOnOpenChange : setUncontrolledOpen

    return (
        <DialogContext.Provider value={{ open: open || false, onOpenChange: onOpenChange || (() => { }) }}>
            {children}
        </DialogContext.Provider>
    )
}

const DialogTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild, children, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialog()

    // If asChild is true, we should clone the child and add the onClick handler
    // But simplified for now: if asChild, return child with onClick injected.
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                onOpenChange(true)
                children.props.onClick?.(e)
            },
            ...props
        })
    }

    return (
        <button
            ref={ref}
            className={cn(className)}
            onClick={(e) => {
                onOpenChange(true)
                onClick?.(e)
            }}
            {...props}
        >
            {children}
        </button>
    )
})
DialogTrigger.displayName = "DialogTrigger"

const DialogContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = useDialog()

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => onOpenChange(false)} />
            <div
                ref={ref}
                className={cn(
                    "relative z-50 grid w-full gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg md:w-full",
                    className
                )}
                {...props}
            >
                {children}
                <div
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500 cursor-pointer"
                    onClick={() => onOpenChange(false)}
                >
                    <X className="h-4 w-4" />
                </div>
            </div>
        </div>
    )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-center sm:text-left",
            className
        )}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className
        )}
        {...props}
    />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-slate-500", className)}
        {...props}
    />
))
DialogDescription.displayName = "DialogDescription"

export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}
