export function PrintSection({ title, children }: { title?: string; children?: React.ReactNode }) {
  return (
    <section data-pdf-section className="bg-white text-black px-2 pb-2">
      {title && <h2 className="text-sm font-bold uppercase tracking-wide mb-2">{title}</h2>}
      {children}
    </section>
  );
}
