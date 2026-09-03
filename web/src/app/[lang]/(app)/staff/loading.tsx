import { Skeleton } from "@/components/ui/skeleton";

export default function StaffLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className="h-9 w-full max-w-xs rounded-md" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
