import { useBaby } from "./useBaby";
import { useCurrentUser } from "./useCurrentUser";
import { ALL_SECTIONS, type Section } from "@/lib/sections";

interface ParentLink {
  id: string;
  userId: string;
  role: "OWNER" | "PARENT";
  sections: Section[];
}

export function useBabyPermissions(babyId: string) {
  const { data: baby, isLoading: babyLoading } = useBaby(babyId);
  const { user, isLoading: userLoading } = useCurrentUser();

  const myLink: ParentLink | undefined = baby?.parents.find((p: ParentLink) => p.userId === user?.id);
  const isOwner = myLink?.role === "OWNER";
  const sections = new Set<Section>(isOwner ? ALL_SECTIONS : myLink?.sections ?? []);

  return {
    baby,
    myLink,
    isOwner,
    isLoading: babyLoading || userLoading,
    hasSection: (section: Section) => sections.has(section),
  };
}
