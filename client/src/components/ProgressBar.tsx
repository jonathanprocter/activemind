import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showLabel?: boolean;
}

export default function ProgressBar({ progress, className, showLabel = false }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={cn("space-y-1", className)}>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
          style={{ width: `${clampedProgress}%` }}
          data-testid="progress-bar-fill"
        />
      </div>
      {showLabel && (
        <p className="text-sm text-muted-foreground" data-testid="progress-bar-label">
          {clampedProgress}% complete
        </p>
      )}
    </div>
  );
}
