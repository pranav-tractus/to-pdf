import { isPdfEncrypted } from "@/src/lib/prepare-pdf";

export async function fileNeedsPassword(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  return isPdfEncrypted(new Uint8Array(buffer));
}
