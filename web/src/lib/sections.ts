export const SECTIONS = [
  { key: "LOGS", label: "Logs", description: "Feeding & diapers" },
  { key: "PHOTOS", label: "Photos", description: "Photo gallery" },
  { key: "HEALTH", label: "Health", description: "Vaccines, growth & records" },
  { key: "DOCTOR_VISITS", label: "Doctor visits", description: "Appointments & questions" },
] as const;

export type Section = (typeof SECTIONS)[number]["key"];

export const ALL_SECTIONS: Section[] = SECTIONS.map((s) => s.key);
