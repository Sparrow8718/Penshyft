"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Session } from "./session";

export type SiteOption = { id: string; name: string };

type SessionContextValue = Session & { sites: SiteOption[] };

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  session,
  sites,
  children,
}: {
  session: Session;
  sites: SiteOption[];
  children: ReactNode;
}) {
  return (
    <SessionContext.Provider value={{ ...session, sites }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
