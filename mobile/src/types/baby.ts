import { Section } from "@/lib/sections";

export interface ParentLink {
  id: string;
  userId: string;
  role: "OWNER" | "PARENT";
  sections: Section[];
}

export interface Baby {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  birthDate: string;
  weight?: number | null;
  height?: number | null;
  profilePhoto?: string | null;
  diaperReminderMinutes?: number | null;
  feedingReminderMinutes?: number | null;
  parents?: ParentLink[];
}
