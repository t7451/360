interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-md bg-zinc-800 ${className}`} />
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-72" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <OrderCardSkeleton key={i} />)}
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="rounded-xl border border-zinc-800 p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
