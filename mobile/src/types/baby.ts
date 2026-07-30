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
  diaperReminderHours?: number | null;
  feedingReminderHours?: number | null;
  parents?: ParentLink[];
}
