import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <>
      <div className="border-b border-border px-6">
        <div className="flex gap-3 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded" />
          ))}
        </div>
      </div>
      <div className="p-6 space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    </>
  );
}
