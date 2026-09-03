import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
