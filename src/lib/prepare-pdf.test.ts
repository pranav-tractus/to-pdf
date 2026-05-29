import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { ConversionError } from "./errors";
import { preparePdfForMerge } from "./prepare-pdf";
import { createSinglePagePdf } from "./test-fixtures";

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "encrypted-test.pdf",
);

describe("preparePdfForMerge", () => {
  it("returns loadable bytes for an unencrypted PDF", async () => {
    const input = await createSinglePagePdf();
    const output = await preparePdfForMerge(input);
    const doc = await PDFDocument.load(output);
    expect(doc.getPageCount()).toBe(1);
  });

  it("throws MERGE_PASSWORD when encrypted and no password", async () => {
    const encrypted = await readFile(fixturePath);

    await expect(preparePdfForMerge(encrypted)).rejects.toMatchObject({
      code: "MERGE_PASSWORD",
    } satisfies Partial<ConversionError>);
  });

  it("decrypts with the correct password", async () => {
    const encrypted = await readFile(fixturePath);
    const output = await preparePdfForMerge(encrypted, "test-secret");
    const doc = await PDFDocument.load(output);
    expect(doc.getPageCount()).toBe(1);
  });

  it("throws MERGE_PASSWORD on wrong password", async () => {
    const encrypted = await readFile(fixturePath);

    await expect(preparePdfForMerge(encrypted, "wrong")).rejects.toMatchObject({
      code: "MERGE_PASSWORD",
    });
  });
});
