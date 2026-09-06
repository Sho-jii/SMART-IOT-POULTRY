export default function LoadingAnimation() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-none z-50">
      <div className="flex flex-col items-center p-8 bg-surface rounded-2xl border border-border shadow-sm max-w-xs text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-accent mb-4" />
        <h2 className="text-base font-heading font-semibold text-foreground">Loading Farm System</h2>
        <p className="text-xs text-muted-foreground mt-1">Connecting to realtime telemetry...</p>
      </div>
    </div>
  )
}
