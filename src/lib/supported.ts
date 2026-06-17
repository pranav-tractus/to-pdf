export const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".tiff",
  ".tif",
  ".bmp",
] as const;

export const DOCX_EXTENSION = ".docx";

export const PDF_EXTENSION = ".pdf";

export const PDF_ACCEPT_ATTRIBUTE = PDF_EXTENSION;

export const MIN_MERGE_PDF_COUNT = 2;

export const DEFAULT_MERGED_FILENAME = "merged.pdf";

const UNSAFE_FILENAME_CHARS = /[/\\?%*:|"<>]/g;

export function isPdfFilename(filename: string): boolean {
  return getExtension(filename) === PDF_EXTENSION;
}

/** Ensure a safe .pdf filename for download / FSA save */
export function normalizeMergedFilename(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return DEFAULT_MERGED_FILENAME;

  const withoutExt = trimmed.replace(/\.pdf$/i, "");
  const safeBase =
    withoutExt.replace(UNSAFE_FILENAME_CHARS, "_").replace(/\s+/g, " ").trim() ||
    "merged";

  return `${safeBase.slice(0, 200)}.pdf`;
}

export const SUPPORTED_EXTENSIONS = [...IMAGE_EXTENSIONS, DOCX_EXTENSION] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const ACCEPT_ATTRIBUTE = SUPPORTED_EXTENSIONS.join(",");

export function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot).toLowerCase();
}

export function isSupportedExtension(ext: string): ext is SupportedExtension {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}

export function isSupportedFilename(filename: string): boolean {
  return isSupportedExtension(getExtension(filename));
}

export function isImageFilename(filename: string): boolean {
  return (IMAGE_EXTENSIONS as readonly string[]).includes(getExtension(filename));
}

export function isDocxFilename(filename: string): boolean {
  return getExtension(filename) === DOCX_EXTENSION;
}

export function pdfOutputName(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  return `${base}.pdf`;
}
