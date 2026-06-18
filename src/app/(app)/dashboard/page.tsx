"use client";
import Link from "next/link";
import { useBabies } from "@/hooks/useBaby";
import { PageHeader } from "@/components/layout/PageHeader";
import { BabyCard } from "@/components/baby/BabyCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardPage() {
  const { data: babies, isLoading } = useBabies();

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Your babies"
        action={
          <Link href="/babies/new">
            <Button size="sm">+ Add baby</Button>
          </Link>
        }
      />
      {isLoading && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}
      {!isLoading && babies?.length === 0 && (
        <div className="text-center py-16 text-pink-400">
          <div className="text-5xl mb-4">🍼</div>
          <p className="text-base font-medium mb-2">No babies yet</p>
          <p className="text-sm mb-6">Add your first baby to start tracking</p>
          <Link href="/babies/new"><Button>Add baby</Button></Link>
        </div>
      )}
      {babies?.length > 0 && (
        <div className="px-4 space-y-3 pb-6">
          {babies.map((baby: { id: string; name: string; birthDate: string; profilePhoto?: string }) => (
            <BabyCard key={baby.id} baby={baby} />
          ))}
        </div>
      )}
    </div>
  );
}
