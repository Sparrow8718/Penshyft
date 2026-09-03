import { Topbar } from "./topbar";

export function Placeholder({
  title,
  subtitle,
  milestone,
  body,
}: {
  title: string;
  subtitle?: string;
  milestone: string;
  body: string;
}) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <div className="flex-1 grid place-items-center px-6 py-12">
        <div className="max-w-lg rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {milestone}
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
    </>
  );
}
