import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/server";
import { computeHorizonDate, materializePattern } from "@/lib/shifts/generate-from-pattern";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supa = db();

  const { data: orgs } = await supa
    .from("org")
    .select("id, generation_horizon_unit, generation_horizon_value");

  let totalCreated = 0;
  let patternsProcessed = 0;

  for (const org of orgs ?? []) {
    const horizonDate = computeHorizonDate(org);
    const horizonStr = horizonDate.toISOString().slice(0, 10);

    const { data: patterns } = await supa
      .from("shift_pattern")
      .select("id, site_id")
      .eq("active", true)
      .eq("auto_generate", true)
      .or(`last_generated_to.is.null,last_generated_to.lt.${horizonStr}`)
      .in(
        "site_id",
        (await supa.from("site").select("id").eq("org_id", org.id)).data?.map((s) => s.id) ?? [],
      );

    for (const p of patterns ?? []) {
      const { created } = await materializePattern(p.id, horizonDate);
      totalCreated += created;
      patternsProcessed++;
    }
  }

  return NextResponse.json({ patternsProcessed, totalCreated });
}
