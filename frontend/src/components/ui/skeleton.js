export default function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse bg-muted rounded-sm ${className}`}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-sm p-6 space-y-3">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-10 w-1/2" />
    </div>
  );
}
