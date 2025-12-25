import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-800', className)}
      {...props}
    />
  );
}

export { Skeleton };
