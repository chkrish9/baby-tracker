export function PrintSection({ title, children }: { title?: string; children?: React.ReactNode }) {
  return (
    <section data-pdf-section className="bg-white text-black px-2 pb-2">
      {title && <h2 className="text-base font-bold uppercase tracking-wide mb-5">{title}</h2>}
      {children}
    </section>
  );
}
