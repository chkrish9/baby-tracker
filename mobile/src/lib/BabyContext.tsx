import { createContext, ReactNode, useContext } from "react";
import { Section } from "@/lib/sections";
import { useSectionAccess } from "@/hooks/useSectionAccess";
import { Baby } from "@/types/baby";

interface BabyCtx {
  baby: Baby | null;
  isLoading: boolean;
  isOwner: boolean;
  hasSection: (section: Section) => boolean;
}

const BabyContext = createContext<BabyCtx | null>(null);

export function BabyProvider({ babyId, children }: { babyId: string; children: ReactNode }) {
  const { baby, isLoading, isOwner, hasSection } = useSectionAccess(babyId);
  return (
    <BabyContext.Provider value={{ baby: baby ?? null, isLoading, isOwner, hasSection }}>
      {children}
    </BabyContext.Provider>
  );
}

export function useBabyContext(): BabyCtx {
  const ctx = useContext(BabyContext);
  if (!ctx) throw new Error("useBabyContext must be used within BabyProvider");
  return ctx;
}
