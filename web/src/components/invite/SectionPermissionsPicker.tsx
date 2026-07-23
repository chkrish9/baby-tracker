import { SECTIONS, type Section } from "@/lib/sections";

interface SectionPermissionsPickerProps {
  value: Set<Section>;
  onChange: (next: Set<Section>) => void;
}

export function SectionPermissionsPicker({ value, onChange }: SectionPermissionsPickerProps) {
  function toggle(section: Section) {
    const next = new Set(value);
    if (next.has(section)) next.delete(section);
    else next.add(section);
    onChange(next);
  }

  return (
    <div className="space-y-1.5">
      {SECTIONS.map((section) => (
        <label
          key={section.key}
          className="flex items-center gap-3 bg-pink-50/50 hover:bg-pink-50 rounded-2xl p-2.5 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            checked={value.has(section.key)}
            onChange={() => toggle(section.key)}
            className="w-4 h-4 rounded accent-pink-500 flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{section.label}</p>
            <p className="text-xs text-foreground/50 truncate">{section.description}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
