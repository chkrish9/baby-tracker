"use client";
import { use, useRef } from "react";
import useSWR, { mutate } from "swr";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { formatBytes } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Doc { id: string; path: string; originalName: string; size: number; mimeType: string; uploadedAt: string; }

function fileIcon(mimeType: string) {
  if (mimeType === "application/pdf") return "📕";
  if (mimeType.startsWith("image/")) return "🖼️";
  return "📄";
}

export default function DocumentsPage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const { data: docs, isLoading } = useSWR(`/api/babies/${babyId}/documents`, fetcher);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    const res = await fetch(`/api/babies/${babyId}/documents`, { method: "POST", body: formData });
    if (res.ok) { await mutate(`/api/babies/${babyId}/documents`); toast("Documents uploaded!", "success"); }
    else { const d = await res.json().catch(() => ({})); toast(d.error ?? "Upload failed", "error"); }
  }

  async function handleDelete(docId: string) {
    const res = await fetch(`/api/babies/${babyId}/documents/${docId}`, { method: "DELETE" });
    if (res.ok) { await mutate(`/api/babies/${babyId}/documents`); toast("Document deleted", "success"); }
    else toast("Failed to delete", "error");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Documents"
        action={<Button size="sm" onClick={() => inputRef.current?.click()}>+ Upload</Button>}
      />
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}
      {!isLoading && !docs?.length && (
        <div className="text-center py-16 text-pink-400">
          <div className="text-5xl mb-3">📄</div>
          <p className="mb-4">No documents yet</p>
          <Button onClick={() => inputRef.current?.click()}>Upload documents</Button>
        </div>
      )}
      <div className="px-4 space-y-2 pb-6">
        {docs?.map((doc: Doc) => (
          <Card key={doc.id} className="flex items-center gap-3">
            <span className="text-2xl">{fileIcon(doc.mimeType)}</span>
            <div className="flex-1 min-w-0">
              <a href={`/api/files/${doc.path}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-pink-700 hover:underline truncate block">{doc.originalName}</a>
              <p className="text-xs text-pink-400">{formatBytes(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString()}</p>
            </div>
            <button onClick={() => handleDelete(doc.id)} className="text-pink-300 hover:text-red-400 text-lg leading-none">&times;</button>
          </Card>
        ))}
      </div>
    </div>
  );
}
