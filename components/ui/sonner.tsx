"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-md group-[.toaster]:rounded-xl group-[.toaster]:font-body",
          title: "group-[.toast]:font-heading group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-accent group-[.toast]:text-accent-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-surface-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success:
            "group-[.toaster]:!bg-accent/10 group-[.toaster]:!border-accent/30 group-[.toaster]:!text-accent",
          error:
            "group-[.toaster]:!bg-destructive/10 group-[.toaster]:!border-destructive/30 group-[.toaster]:!text-destructive",
          warning:
            "group-[.toaster]:!bg-warning/10 group-[.toaster]:!border-warning/30 group-[.toaster]:!text-warning",
          info:
            "group-[.toaster]:!bg-surface-muted group-[.toaster]:!border-border group-[.toaster]:!text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
