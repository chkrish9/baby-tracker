const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const MARGIN_PT = 32;
const CONTENT_WIDTH_PT = A4_WIDTH_PT - MARGIN_PT * 2;
const CONTENT_HEIGHT_PT = A4_HEIGHT_PT - MARGIN_PT * 2;
const CAPTURE_WIDTH_PX = 794; // A4 width at 96dpi
const CAPTURE_SCALE = 2;

export function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll("img"));
  return Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  ).then(() => undefined);
}

export async function generatePdfFromSections(root: HTMLElement, filename: string): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);

  const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-section]"));
  const targets = sections.length > 0 ? sections : [root];

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const ptPerPx = CONTENT_WIDTH_PT / (CAPTURE_WIDTH_PX * CAPTURE_SCALE);

  let cursorYPt = 0;

  for (const sectionEl of targets) {
    const canvas = await html2canvas(sectionEl, {
      scale: CAPTURE_SCALE,
      backgroundColor: "#ffffff",
      useCORS: true,
      width: CAPTURE_WIDTH_PX,
      windowWidth: CAPTURE_WIDTH_PX,
    });

    let offsetPx = 0;

    // Fill whatever space remains on the current page first (even if that's less
    // than a full page), then continue slicing across as many further pages as
    // needed. This avoids leaving a section's remaining vertical space blank just
    // because the whole section didn't fit — e.g. a long data table now fills the
    // rest of the current page and spills the remainder onto the next one, rather
    // than jumping to a fresh page in its entirety.
    while (offsetPx < canvas.height) {
      let remainingPt = CONTENT_HEIGHT_PT - cursorYPt;
      if (remainingPt <= 0) {
        pdf.addPage();
        cursorYPt = 0;
        remainingPt = CONTENT_HEIGHT_PT;
      }

      const remainingPx = remainingPt / ptPerPx;
      const sliceHeightPx = Math.min(remainingPx, canvas.height - offsetPx);
      const sliceHeightPt = sliceHeightPx * ptPerPx;

      let imageData: string;
      if (offsetPx === 0 && sliceHeightPx === canvas.height) {
        imageData = canvas.toDataURL("image/png", 1.0);
      } else {
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, offsetPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
        imageData = sliceCanvas.toDataURL("image/png", 1.0);
      }

      pdf.addImage(imageData, "PNG", MARGIN_PT, MARGIN_PT + cursorYPt, CONTENT_WIDTH_PT, sliceHeightPt);

      offsetPx += sliceHeightPx;
      cursorYPt += sliceHeightPt;
    }
  }

  if (typeof window !== "undefined" && (window as unknown as { __debugPdf?: boolean }).__debugPdf) {
    (window as unknown as { __debugPdfUrl?: string }).__debugPdfUrl = pdf.output("bloburl") as unknown as string;
    return;
  }
  pdf.save(filename);
}
