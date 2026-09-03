import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="rounded-xl border border-border bg-card p-8 max-w-sm text-center space-y-4">
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/en/dashboard"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
