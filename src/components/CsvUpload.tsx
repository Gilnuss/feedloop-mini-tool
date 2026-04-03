"use client";

import { useState, useRef } from "react";
import { parseCSV, detectFeedbackColumn } from "@/lib/csvParser";

interface Props {
  onItemsSelected: (items: string[]) => void;
}

interface CsvState {
  rows: Record<string, string>[];
  columns: string[];
  selectedColumn: string;
  fileName: string;
}

export function CsvUpload({ onItemsSelected }: Props) {
  const [csvState, setCsvState] = useState<CsvState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      alert("No data found in CSV.");
      return;
    }

    const columns = Object.keys(rows[0]);
    const detectedColumn = detectFeedbackColumn(rows);

    setCsvState({
      rows,
      columns,
      selectedColumn: detectedColumn,
      fileName: file.name,
    });

    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleConfirm = () => {
    if (!csvState) return;

    const items = csvState.rows
      .map((row) => row[csvState.selectedColumn] || "")
      .filter((item) => item.trim().length > 0);

    onItemsSelected(items);
    setCsvState(null);
  };

  const getPreview = (column: string): string => {
    if (!csvState) return "";
    const first = csvState.rows[0]?.[column] || "";
    return first.length > 40 ? first.slice(0, 40) + "..." : first;
  };

  const getItemCount = (): number => {
    if (!csvState) return 0;
    return csvState.rows
      .map((row) => row[csvState.selectedColumn] || "")
      .filter((item) => item.trim().length > 0).length;
  };

  return (
    <>
      {/* Upload button */}
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-[#27272A] rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload CSV
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.tsv"
        className="hidden"
        onChange={handleFile}
      />

      {/* Column picker modal */}
      {csvState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[560px] max-h-[90vh] overflow-y-auto bg-[#141414] border border-[#27272A] rounded-2xl p-7 flex flex-col gap-5 shadow-2xl">
            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold text-white">
                Your CSV has {csvState.columns.length} columns
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                Which column contains the feedback text?
              </p>
            </div>

            {/* Column list */}
            <div className="flex flex-col gap-2">
              {csvState.columns.map((col) => {
                const isSelected = col === csvState.selectedColumn;
                const isDetected = col === detectFeedbackColumn(csvState.rows);

                return (
                  <button
                    key={col}
                    onClick={() =>
                      setCsvState({ ...csvState, selectedColumn: col })
                    }
                    className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-purple-600 border-2 border-purple-500"
                        : "bg-[#1A1A1A] border border-[#27272A] hover:border-zinc-600"
                    }`}
                  >
                    {/* Radio */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-white bg-white"
                          : "border-zinc-600"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-purple-600" />
                      )}
                    </div>

                    {/* Column name */}
                    <span
                      className={`font-mono text-[13px] ${
                        isSelected ? "text-white font-semibold" : "text-zinc-400"
                      }`}
                    >
                      {col}
                    </span>

                    {/* Preview value */}
                    <span
                      className={`text-xs truncate ${
                        isSelected ? "text-white/70" : "text-zinc-600"
                      }`}
                    >
                      &ldquo;{getPreview(col)}&rdquo;
                    </span>

                    {/* Auto-detected badge */}
                    {isSelected && isDetected && (
                      <span className="ml-auto shrink-0 px-2 py-0.5 rounded bg-white/20 text-[10px] font-medium text-white">
                        Auto-detected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Preview */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-zinc-500">
                Preview (first 3 of {getItemCount()} items):
              </p>
              <div className="bg-[#0D0D0D] rounded-lg p-3 flex flex-col gap-1.5">
                {csvState.rows.slice(0, 3).map((row, i) => (
                  <p key={i} className="text-xs text-zinc-400">
                    {i + 1}. &ldquo;
                    {(row[csvState.selectedColumn] || "").length > 80
                      ? (row[csvState.selectedColumn] || "").slice(0, 80) + "..."
                      : row[csvState.selectedColumn] || ""}
                    &rdquo;
                  </p>
                ))}
                {csvState.rows.length > 3 && (
                  <p className="text-[11px] text-zinc-600">
                    ... +{csvState.rows.length - 3} more items
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-600">
                {csvState.fileName} · {csvState.rows.length} rows ·{" "}
                {csvState.columns.length} columns
              </span>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setCsvState(null)}
                  className="px-4 py-2 bg-[#1A1A1A] border border-[#27272A] rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-5 py-2 bg-purple-600 rounded-lg text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
                >
                  Decode {getItemCount()} items →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
