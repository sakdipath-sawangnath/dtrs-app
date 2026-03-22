/** รอให้ webfont (เช่น Sarabun จาก next/font) โหลดก่อนพิมพ์/PDF */
export function waitForFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.ready) {
    return Promise.resolve();
  }
  return document.fonts.ready.then(() => undefined);
}
