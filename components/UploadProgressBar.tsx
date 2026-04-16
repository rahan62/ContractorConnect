"use client";

/**
 * Determinate 0–100, or indeterminate (animated) when progress is null.
 */
export function UploadProgressBar({
  progress,
  label,
  className = ""
}: {
  progress: number | null;
  label?: string;
  className?: string;
}) {
  const indeterminate = progress === null;

  return (
    <div className={`space-y-1.5 ${className}`} role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{label ?? "Uploading…"}</span>
        {!indeterminate && (
          <span className="tabular-nums font-medium text-foreground">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        {indeterminate ? (
          <div className="upload-progress-indeterminate-bar" />
        ) : (
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        )}
      </div>
    </div>
  );
}
