const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const MARGIN_PT = 32;
const CONTENT_WIDTH_PT = A4_WIDTH_PT - MARGIN_PT * 2;
const CONTENT_HEIGHT_PT = A4_HEIGHT_PT - MARGIN_PT * 2;
const CAPTURE_WIDTH_PX = 794; // A4 width at 96dpi
const CAPTURE_SCALE = 2;
const SLICE_SNAP_SEARCH_PX = 160; // ~ a couple of table rows at CAPTURE_SCALE
const SLICE_MIN_PROGRESS_PX = 24; // guarantees each page makes forward progress

// Finds the "most blank" row within the search window immediately before the naive
// slice boundary, and ends the slice there instead — so a page break doesn't land in the
// middle of a table row's text. Requiring a *perfectly* all-white row (as a stricter
// version of this once did) is too fragile: anti-aliasing means real gaps between rows
// are rarely 100% white, so that approach kept finding a technically-blank sliver just a
// few px back rather than the actual gap. Scoring every row by total ink and picking the
// lightest one is robust to that noise. Ties prefer the row closest to naiveEndPx, to use
// as much of the available page space as possible.
function findSafeSliceEnd(canvas: HTMLCanvasElement, naiveEndPx: number, sliceStartPx: number): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return naiveEndPx;

  const maxY = Math.floor(naiveEndPx);
  const minY = Math.max(Math.floor(sliceStartPx), maxY - SLICE_SNAP_SEARCH_PX);
  const windowHeight = maxY - minY;
  if (windowHeight <= 0) return naiveEndPx;

  const width = canvas.width;
  const { data } = ctx.getImageData(0, minY, width, windowHeight);

  let bestRow = windowHeight;
  let bestScore = Infinity;
  for (let row = 0; row < windowHeight; row++) {
    const rowOffset = row * width * 4;
    let score = 0;
    for (let x = 0; x < width; x++) {
      const i = rowOffset + x * 4;
      score += 255 - data[i] + (255 - data[i + 1]) + (255 - data[i + 2]);
    }
    if (score <= bestScore) {
      bestScore = score;
      bestRow = row;
    }
  }

  return minY + bestRow;
}

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
      let sliceHeightPx = Math.min(remainingPx, canvas.height - offsetPx);

      // If there's more content after this slice, don't just cut at the arbitrary pixel
      // boundary — snap back to the nearest blank row so a table row (or anything else)
      // doesn't get visually split across the page break. Guard against the snapped
      // point landing at (or before) offsetPx itself — that would make sliceHeightPx zero
      // (or negative) and the outer while loop would never advance, hanging forever. When
      // there isn't enough room to snap safely, just use the unsnapped boundary for this
      // page instead of risking that.
      if (offsetPx + sliceHeightPx < canvas.height) {
        const naiveEndPx = offsetPx + sliceHeightPx;
        const safeEnd = findSafeSliceEnd(canvas, naiveEndPx, offsetPx);
        if (safeEnd - offsetPx >= SLICE_MIN_PROGRESS_PX) {
          sliceHeightPx = safeEnd - offsetPx;
        }
      }

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

  pdf.save(filename);
}
