import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { ConversionError } from "./errors";
import { mergePdfs } from "./merge-pdfs";
import { createSinglePagePdf } from "./test-fixtures";

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "encrypted-test.pdf",
);

describe("mergePdfs", () => {
  it("merges two PDFs in order", async () => {
    const a = await createSinglePagePdf();
    const b = await createSinglePagePdf();

    const merged = await mergePdfs([a, b]);
    const doc = await PDFDocument.load(merged);
    expect(doc.getPageCount()).toBe(2);
  });

  it("requires at least two PDFs", async () => {
    const a = await createSinglePagePdf();
    await expect(mergePdfs([a])).rejects.toBeInstanceOf(ConversionError);
  });

  it("uses passwords array aligned with inputs", async () => {
    const plain = await createSinglePagePdf();
    const encrypted = await readFile(fixturePath);

    const merged = await mergePdfs([encrypted, plain], ["test-secret", undefined]);
    const doc = await PDFDocument.load(merged);
    expect(doc.getPageCount()).toBe(2);
  });
});
