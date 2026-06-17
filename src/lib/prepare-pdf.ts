import { decryptPDF } from "@pdfsmaller/pdf-decrypt";
import { PDFDocument } from "pdf-lib";

import { ConversionError } from "./errors";

export async function isPdfEncrypted(input: Uint8Array | Buffer): Promise<boolean> {
  const doc = await PDFDocument.load(input, { ignoreEncryption: true });
  return doc.isEncrypted;
}

export async function preparePdfForMerge(
  input: Buffer,
  password?: string,
): Promise<Buffer> {
  const encrypted = await isPdfEncrypted(input);

  if (!encrypted) {
    return input;
  }

  if (!password) {
    throw new ConversionError(
      "This PDF is password-protected. Enter the password to continue.",
      "MERGE_PASSWORD",
    );
  }

  try {
    const decrypted = await decryptPDF(new Uint8Array(input), password);
    const doc = await PDFDocument.load(decrypted);
    return Buffer.from(await doc.save());
  } catch (error) {
    if (error instanceof ConversionError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("password")) {
      throw new ConversionError("Incorrect PDF password.", "MERGE_PASSWORD");
    }
    throw new ConversionError("Incorrect PDF password.", "MERGE_PASSWORD");
  }
}
