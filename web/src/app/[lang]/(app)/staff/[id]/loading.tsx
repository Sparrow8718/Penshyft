export default function StaffDetailLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-muted rounded" />
      <div className="h-4 w-32 bg-muted rounded" />
      <div className="grid gap-4 sm:grid-cols-2 mt-6">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-32 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
