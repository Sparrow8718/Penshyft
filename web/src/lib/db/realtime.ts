"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "./auth-browser";

export function useRealtimeTable(
  table: string,
  filter?: { column: string; value: string },
) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserSupabase();

    let channelConfig: Parameters<typeof supabase.channel>[1] = undefined;
    const channelName = filter
      ? `realtime-${table}-${filter.column}-${filter.value}`
      : `realtime-${table}`;

    const channel = supabase
      .channel(channelName, channelConfig)
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter?.column, filter?.value, router]);
}
