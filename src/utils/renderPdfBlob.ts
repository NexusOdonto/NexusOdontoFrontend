/** Lazy-load @react-pdf only when the user exports — keeps it out of the landing graph. */
export async function renderPdfBlob(document: React.ReactElement): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  // react-pdf Document props are narrower than a generic ReactElement
  return pdf(document as Parameters<typeof pdf>[0]).toBlob();
}
