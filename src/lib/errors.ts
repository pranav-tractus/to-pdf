export class ConversionError extends Error {
  constructor(
    message: string,
    public readonly code: "UNSUPPORTED" | "LIBREOFFICE" | "IMAGE" | "UNKNOWN" = "UNKNOWN",
  ) {
    super(message);
    this.name = "ConversionError";
  }
}

export const LIBREOFFICE_INSTALL_HINT =
  "Install LibreOffice: brew install --cask libreoffice";
