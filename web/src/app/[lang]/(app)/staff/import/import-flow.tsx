"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { parseCsv, type CsvRow } from "@/lib/csv/parse";
import { importStaffBulk } from "../actions";

type Step = "upload" | "preview" | "done";

const EXPECTED_HEADERS = ["name", "email", "mobile", "notes"];

export function ImportFlow({ orgId, locale }: { orgId: string; locale: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ imported?: number; error?: string } | null>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCsv(text);

      const errs: string[] = [];
      if (!h.includes("name")) {
        errs.push("CSV must have a 'name' column.");
      }
      const emptyNames = r.filter((row) => !row.name?.trim());
      if (emptyNames.length > 0) {
        errs.push(`${emptyNames.length} row(s) have no name and will be skipped.`);
      }

      setHeaders(h);
      setRows(r);
      setErrors(errs);
      setStep("preview");
    };
    reader.readAsText(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleImport() {
    const validRows = rows
      .filter((r) => r.name?.trim())
      .map((r) => ({
        name: r.name ?? "",
        email: r.email || null,
        mobile: r.mobile || null,
        notes: r.notes || null,
      }));

    startTransition(async () => {
      const res = await importStaffBulk(validRows);
      setResult(res);
      setStep("done");
    });
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/${locale}/staff`)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent transition"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-semibold">Import Staff</h1>
          <p className="text-xs text-muted-foreground">
            Upload a CSV file with columns: name, email, mobile, notes
          </p>
        </div>
      </div>

      {step === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-lg border-2 border-dashed border-border p-12 text-center hover:border-primary/40 transition cursor-pointer"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".csv";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFile(file);
            };
            input.click();
          }}
        >
          <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Click or drag a CSV file here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Required column: name. Optional: email, mobile, notes
          </p>
        </div>
      )}

      {step === "preview" && (
        <>
          {errors.length > 0 && (
            <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 space-y-1">
              {errors.map((err, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-warning">
                  <AlertTriangle size={12} /> {err}
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                  {EXPECTED_HEADERS.filter((h) => headers.includes(h)).map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground capitalize">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, i) => {
                  const valid = !!row.name?.trim();
                  return (
                    <tr
                      key={i}
                      className={`border-b border-border last:border-0 ${!valid ? "opacity-40" : ""}`}
                    >
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{i + 1}</td>
                      {EXPECTED_HEADERS.filter((h) => headers.includes(h)).map((h) => (
                        <td key={h} className="px-3 py-1.5 text-xs">
                          {row[h] ?? ""}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {rows.length > 50 && (
            <p className="text-xs text-muted-foreground text-center">
              Showing 50 of {rows.length} rows
            </p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm">
              <span className="font-medium">{rows.filter((r) => r.name?.trim()).length}</span>{" "}
              staff members to import
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { setStep("upload"); setRows([]); setHeaders([]); setErrors([]); }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={pending || !rows.some((r) => r.name?.trim())}
              >
                {pending ? "Importing…" : "Import"}
              </Button>
            </div>
          </div>
        </>
      )}

      {step === "done" && result && (
        <div className="rounded-lg border border-border p-8 text-center">
          {result.error ? (
            <>
              <AlertTriangle size={32} className="mx-auto text-warning mb-3" />
              <p className="text-sm font-medium mb-1">Import failed</p>
              <p className="text-xs text-muted-foreground">{result.error}</p>
              <Button variant="ghost" className="mt-4" onClick={() => { setStep("upload"); setRows([]); setResult(null); }}>
                Try again
              </Button>
            </>
          ) : (
            <>
              <Check size={32} className="mx-auto text-emerald-500 mb-3" />
              <p className="text-sm font-medium mb-1">
                {result.imported} staff member{result.imported === 1 ? "" : "s"} imported
              </p>
              <Button variant="primary" className="mt-4" onClick={() => router.push(`/${locale}/staff`)}>
                Go to Staff
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
