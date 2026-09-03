import type { ReactNode } from "react";
import { MarketingHeader } from "./marketing-header";
import { MarketingFooter } from "./marketing-footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
