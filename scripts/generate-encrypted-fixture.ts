import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { encryptPDF } from "@pdfsmaller/pdf-encrypt";
import { PDFDocument } from "pdf-lib";

const PASSWORD = "test-secret";

async function main(): Promise<void> {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const outDir = path.join(dir, "../src/lib/fixtures");

  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const plain = await doc.save();
  const encrypted = await encryptPDF(plain, PASSWORD);

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "encrypted-test.pdf"), encrypted);
  console.log("Wrote encrypted-test.pdf");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
