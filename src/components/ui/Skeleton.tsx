import { cn } from '@/lib/utils';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div aria-hidden className={cn('skeleton rounded-xl', className)} {...props} />;
}

export function TableSkeleton({
  rows = 8,
  columns = 6,
  showHeader = true,
  className,
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto', className)} aria-label="Chargement">
      <table className="w-full">
        {showHeader && (
          <thead>
            <tr className="border-b border-border">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="py-3 px-3">
                  <Skeleton className={cn('h-3 w-24 rounded-md', i === columns - 1 && 'ml-auto w-16')} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-border/50">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="py-3 px-3">
                  <Skeleton
                    className={cn(
                      'h-4 rounded-md',
                      c === 0 ? 'w-56' : c === columns - 1 ? 'ml-auto w-20' : 'w-32'
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListSkeleton({
  items = 6,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)} aria-label="Chargement">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 rounded-md" />
            <Skeleton className="h-3 w-72 rounded-md" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

