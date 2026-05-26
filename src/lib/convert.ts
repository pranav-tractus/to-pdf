import { convertDocxToPdf } from "./convert-docx";
import { convertImageToPdf } from "./convert-image";
import { ConversionError } from "./errors";
import {
  isDocxFilename,
  isImageFilename,
  isSupportedFilename,
} from "./supported";

export async function convertToPdf(
  input: Buffer,
  filename: string,
): Promise<Buffer> {
  if (!isSupportedFilename(filename)) {
    throw new ConversionError(
      `Unsupported file type: ${filename}. Supported: images and .docx`,
      "UNSUPPORTED",
    );
  }

  if (isDocxFilename(filename)) {
    return convertDocxToPdf(input);
  }

  if (isImageFilename(filename)) {
    return convertImageToPdf(input, filename);
  }

  throw new ConversionError(
    `Unsupported file type: ${filename}`,
    "UNSUPPORTED",
  );
}

export { ConversionError, LIBREOFFICE_INSTALL_HINT } from "./errors";
export {
  ACCEPT_ATTRIBUTE,
  MAX_FILE_SIZE_BYTES,
  pdfOutputName,
  SUPPORTED_EXTENSIONS,
} from "./supported";
