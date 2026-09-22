"use client";

import { useRef, useState } from "react";
import { api, errorMessage } from "@/lib/client/api";

const ACCEPT = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

interface UploadResult {
  key: string;
  uploadUrl: string;
  path: string;
  snippet: string;
}

/** PUT con progreso (fetch no expone el progreso de subida). */
function putWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`El almacenamiento rechazó la subida (${xhr.status}).`)));
    xhr.onerror = () => reject(new Error("No se pudo conectar con el almacenamiento. Revisa la configuración CORS del bucket."));
    xhr.send(file);
  });
}

export function FileUploader({ onInsert }: { onInsert: (snippet: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(UploadResult & { fileName: string }) | null>(null);
  const [copied, setCopied] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setResult(null);
    setCopied(false);

    if (!ACCEPT.includes(file.type)) return setError("Tipo no permitido. Sube un PDF, PNG, JPEG o WebP.");

    try {
      setProgress(0);
      const signed = await api<UploadResult>("POST", "/api/uploads", { filename: file.name, contentType: file.type, size: file.size });
      await putWithProgress(signed.uploadUrl, file, setProgress);
      setResult({ ...signed, fileName: file.name });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="panel p-4" data-testid="file-uploader">
      <p className="field-label">Adjuntar fichero</p>
      <p className="field-hint mb-3 mt-0">PDF o imagen (PNG, JPEG, WebP). Al subirlo obtienes el fragmento Markdown para insertarlo.</p>
      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(",")}
        onChange={onChange}
        disabled={progress !== null}
        className="sr-only"
        id="file-input"
        data-testid="file-input"
      />
      <label htmlFor="file-input" className={`btn btn-secondary btn-sm ${progress !== null ? "opacity-55" : "cursor-pointer"}`}>
        Elegir fichero
      </label>

      {progress !== null && (
        <div className="mt-3" role="status">
          <div className="h-2 overflow-hidden rounded bg-rule" aria-hidden="true">
            <div className="h-full bg-line transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-sm text-muted">Subiendo… {progress}%</p>
        </div>
      )}
      {error && (
        <p className="notice notice-error mt-3" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-3 space-y-2" role="status">
          <p className="notice notice-ok">«{result.fileName}» subido.</p>
          <code className="block break-all rounded bg-paper p-2 font-mono text-xs" data-testid="upload-snippet">
            {result.snippet}
          </code>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onInsert(result.snippet)}>
              Insertar en el contenido
            </button>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result.snippet);
                  setCopied(true);
                } catch {
                  setError("No se pudo copiar. Selecciona el fragmento y cópialo a mano.");
                }
              }}
            >
              {copied ? "Copiado" : "Copiar fragmento"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
