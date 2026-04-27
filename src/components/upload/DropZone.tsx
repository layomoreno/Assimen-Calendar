"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Image, FileSpreadsheet, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface DropZoneProps {
  onFilesAccepted: (files: File[]) => void;
  isProcessing?: boolean;
  processingProgress?: number;
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "text/plain": [".txt"],
};

function getFileIcon(type: string) {
  if (type.includes("pdf")) return <FileText className="w-5 h-5 text-status-danger" />;
  if (type.includes("image")) return <Image className="w-5 h-5 text-status-info" />;
  if (type.includes("sheet") || type.includes("excel"))
    return <FileSpreadsheet className="w-5 h-5 text-status-active" />;
  return <FileText className="w-5 h-5 text-text-muted" />;
}

export function DropZone({
  onFilesAccepted,
  isProcessing = false,
  processingProgress = 0,
}: DropZoneProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles(acceptedFiles);
      onFilesAccepted(acceptedFiles);
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Drop Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8
          transition-all duration-300 cursor-pointer
          ${
            isDragActive
              ? "border-accent bg-accent/5 scale-[1.02]"
              : "border-border hover:border-accent/40 hover:bg-bg-card"
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={`
              w-14 h-14 rounded-2xl flex items-center justify-center
              ${isDragActive ? "accent-gradient" : "bg-bg-card border border-border"}
              transition-all duration-300
            `}
          >
            <Upload
              className={`w-6 h-6 ${isDragActive ? "text-text-on-accent" : "text-accent"}`}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {isDragActive
                ? "Suelta tu archivo aquí"
                : "Arrastra y suelta tus archivos"}
            </p>
            <p className="text-xs text-text-muted mt-1">
              PDF, JPG, PNG, Excel, TXT — Máx. 10MB
            </p>
          </div>
          <Button variant="secondary" size="sm">
            Seleccionar Archivos
          </Button>
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <Card padding="md" className="animate-pulse-glow border-accent/30">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">
                Analizando con IA...
              </p>
              <div className="mt-2 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full accent-gradient rounded-full transition-all duration-500"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-bold text-accent">
              {processingProgress}%
            </span>
          </div>
        </Card>
      )}

      {/* File List */}
      {files.length > 0 && !isProcessing && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <Card key={index} padding="sm" className="animate-fade-in">
              <div className="flex items-center gap-3">
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 rounded-lg text-text-muted hover:text-status-danger hover:bg-status-danger/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
