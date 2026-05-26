import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

import { ConversionError } from "./errors";
import { getExtension } from "./supported";

export async function convertImageToPdf(input: Buffer, filename: string): Promise<Buffer> {
  try {
    const image = sharp(input, { failOn: "error" });
    const metadata = await image.metadata();

    const width = metadata.width;
    const height = metadata.height;

    if (!width || !height) {
      throw new ConversionError("Could not read image dimensions.", "IMAGE");
    }

    const ext = getExtension(filename);
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([width, height]);

    if (ext === ".jpg" || ext === ".jpeg") {
      const jpegBuffer = await image.jpeg().toBuffer();
      const embedded = await pdfDoc.embedJpg(jpegBuffer);
      page.drawImage(embedded, { x: 0, y: 0, width, height });
    } else {
      const pngBuffer = await image.png().toBuffer();
      const embedded = await pdfDoc.embedPng(pngBuffer);
      page.drawImage(embedded, { x: 0, y: 0, width, height });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    if (error instanceof ConversionError) throw error;

    const message = error instanceof Error ? error.message : String(error);
    throw new ConversionError(`Image conversion failed: ${message}`, "IMAGE");
  }
}
