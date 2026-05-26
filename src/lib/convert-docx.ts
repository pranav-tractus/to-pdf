import { promisify } from "node:util";
import libre from "libreoffice-convert";

import { ConversionError, LIBREOFFICE_INSTALL_HINT } from "./errors";

const convertAsync = promisify(libre.convert);

export async function convertDocxToPdf(input: Buffer): Promise<Buffer> {
  try {
    const result = await convertAsync(input, ".pdf", undefined);
    return Buffer.from(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const looksLikeMissingLibreOffice =
      /libreoffice|soffice|ENOENT|spawn/i.test(message) ||
      message.includes("Could not find");

    if (looksLikeMissingLibreOffice) {
      throw new ConversionError(
        `LibreOffice is required for DOCX conversion. ${LIBREOFFICE_INSTALL_HINT}`,
        "LIBREOFFICE",
      );
    }

    throw new ConversionError(
      `DOCX conversion failed: ${message}`,
      "LIBREOFFICE",
    );
  }
}
