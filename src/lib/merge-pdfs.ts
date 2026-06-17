import { PDFDocument } from "pdf-lib";

import { ConversionError } from "./errors";
import { preparePdfForMerge } from "./prepare-pdf";
import { MIN_MERGE_PDF_COUNT } from "./supported";

export type MergePasswords = (string | undefined)[];

export async function mergePdfs(
  inputs: Buffer[],
  passwords: MergePasswords = [],
): Promise<Buffer> {
  if (inputs.length < MIN_MERGE_PDF_COUNT) {
    throw new ConversionError(
      `At least ${MIN_MERGE_PDF_COUNT} PDFs are required to merge.`,
      "MERGE",
    );
  }

  const merged = await PDFDocument.create();

  for (let index = 0; index < inputs.length; index += 1) {
    const password = passwords[index];

    try {
      const loadable = await preparePdfForMerge(inputs[index], password);
      const source = await PDFDocument.load(loadable);
      const copied = await merged.copyPages(source, source.getPageIndices());
      for (const page of copied) {
        merged.addPage(page);
      }
    } catch (error) {
      if (error instanceof ConversionError) {
        if (error.code === "MERGE_PASSWORD") {
          throw new ConversionError(
            `Password required for PDF at position ${index + 1}: ${error.message}`,
            "MERGE_PASSWORD",
          );
        }
        throw error;
      }
      throw new ConversionError(
        `Invalid or corrupted PDF at position ${index + 1}.`,
        "MERGE",
      );
    }
  }

  return Buffer.from(await merged.save());
}
