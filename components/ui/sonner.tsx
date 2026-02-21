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
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl group-[.toaster]:font-body",
          title: "group-[.toast]:font-heading group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success:
            "group-[.toaster]:!bg-sage/10 group-[.toaster]:!border-sage/30 group-[.toaster]:!text-sage",
          error:
            "group-[.toaster]:!bg-brick/10 group-[.toaster]:!border-brick/30 group-[.toaster]:!text-brick",
          warning:
            "group-[.toaster]:!bg-harvest/10 group-[.toaster]:!border-harvest/30 group-[.toaster]:!text-harvest",
          info:
            "group-[.toaster]:!bg-pond/10 group-[.toaster]:!border-pond/30 group-[.toaster]:!text-pond",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
