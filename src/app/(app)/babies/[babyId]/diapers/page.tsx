"use client";
import { use } from "react";
import Link from "next/link";
import { mutate } from "swr";
import { useDiapers } from "@/hooks/useDiapers";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

const typeLabel: Record<string, string> = { WET: "Wet", DIRTY: "Dirty", BOTH: "Wet + Dirty", DRY: "Dry" };
const typeBadge: Record<string, "pink" | "mint" | "butter" | "sky"> = { WET: "sky", DIRTY: "butter", BOTH: "mint", DRY: "pink" };

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

interface DiaperLog { id: string; type: string; notes?: string | null; loggedAt: string; }

export default function DiapersPage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const { data: logs, isLoading } = useDiapers(babyId);
  const { toast } = useToast();

  async function handleDelete(logId: string) {
    const res = await fetch(`/api/babies/${babyId}/diapers/${logId}`, { method: "DELETE" });
    if (res.ok) { mutate(`/api/babies/${babyId}/diapers`); toast("Entry deleted", "success"); }
    else toast("Failed to delete", "error");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Diapers"
        action={<Link href={`/babies/${babyId}/diapers/new`}><Button size="sm">+ Log</Button></Link>}
      />
      {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}
      {!isLoading && !logs?.length && (
        <div className="text-center py-16 text-pink-400">
          <div className="text-5xl mb-3">👶</div>
          <p className="mb-4">No diaper changes logged yet</p>
          <Link href={`/babies/${babyId}/diapers/new`}><Button>Log diaper</Button></Link>
        </div>
      )}
      <div className="px-4 space-y-2 pb-6">
        {logs?.map((log: DiaperLog) => (
          <Card key={log.id} className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={typeBadge[log.type] ?? "pink"}>{typeLabel[log.type] ?? log.type}</Badge>
                <span className="text-xs text-pink-400">{formatTime(log.loggedAt)}</span>
              </div>
              {log.notes && <p className="text-xs text-pink-400 mt-1">{log.notes}</p>}
            </div>
            <button onClick={() => handleDelete(log.id)} className="text-pink-300 hover:text-red-400 text-lg leading-none mt-0.5">&times;</button>
          </Card>
        ))}
      </div>
    </div>
  );
}
