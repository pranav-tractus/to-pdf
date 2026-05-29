import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Command } from "commander";

import { convertToPdf, ConversionError } from "../src/lib/convert";
import { mergePdfs } from "../src/lib/merge-pdfs";
import { isPdfEncrypted, preparePdfForMerge } from "../src/lib/prepare-pdf";
import {
  isPdfFilename,
  MIN_MERGE_PDF_COUNT,
  pdfOutputName,
} from "../src/lib/supported";
import { promptPassword } from "./prompt-password";

const program = new Command();

program.name("to-pdf").description("Convert and merge PDF tools locally");

async function runConvert(
  files: string[],
  options: { output?: string; outputDir?: string },
): Promise<void> {
  if (files.length === 0) {
    console.error("No input files provided.");
    process.exit(1);
  }

  if (options.output && files.length > 1) {
    console.error("-o/--output only supports a single input file.");
    process.exit(1);
  }

  if (options.output && options.outputDir) {
    console.error("Use either -o/--output or --output-dir, not both.");
    process.exit(1);
  }

  if (files.length > 1 && !options.outputDir) {
    console.error("Multiple files require --output-dir.");
    process.exit(1);
  }

  if (files.length === 1 && !options.output && !options.outputDir) {
    console.error("Specify -o/--output or --output-dir.");
    process.exit(1);
  }

  let hasError = false;

  if (options.outputDir) {
    await mkdir(options.outputDir, { recursive: true });
  }

  for (const inputPath of files) {
    const resolvedInput = path.resolve(inputPath);
    const basename = path.basename(resolvedInput);

    try {
      const input = await readFile(resolvedInput);
      const pdf = await convertToPdf(input, basename);

      let outputPath: string;
      if (options.output) {
        outputPath = path.resolve(options.output);
      } else {
        outputPath = path.join(
          path.resolve(options.outputDir!),
          pdfOutputName(basename),
        );
      }

      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, pdf);
      console.log(`Wrote ${outputPath}`);
    } catch (error) {
      hasError = true;
      if (error instanceof ConversionError) {
        console.error(`${basename}: ${error.message}`);
      } else if (error instanceof Error) {
        console.error(`${basename}: ${error.message}`);
      } else {
        console.error(`${basename}: ${String(error)}`);
      }
    }
  }

  process.exit(hasError ? 1 : 0);
}

program
  .command("convert")
  .description("Convert DOCX and image files to PDF (default)")
  .argument("<files...>", "Input files (.docx, .png, .jpg, etc.)")
  .option("-o, --output <path>", "Output PDF path (single input only)")
  .option(
    "--output-dir <dir>",
    "Directory for output PDFs (one per input file)",
  )
  .action(runConvert);

program
  .argument("[files...]", "Shorthand for: to-pdf convert <files...>")
  .option("-o, --output <path>", "Output PDF path (single input only)")
  .option(
    "--output-dir <dir>",
    "Directory for output PDFs (one per input file)",
  )
  .action(async (files: string[], options) => {
    if (files.length === 0) {
      program.help();
      return;
    }
    await runConvert(files, options);
  });

program
  .command("merge")
  .description("Merge multiple PDFs into one file")
  .argument("<pdfs...>", "PDF files to merge (in order)")
  .requiredOption("-o, --output <path>", "Output merged PDF path")
  .action(async (pdfs: string[], options: { output: string }) => {
    if (pdfs.length < MIN_MERGE_PDF_COUNT) {
      console.error(
        `At least ${MIN_MERGE_PDF_COUNT} PDF files are required to merge.`,
      );
      process.exit(1);
    }

    const buffers: Buffer[] = [];

    for (const inputPath of pdfs) {
      const resolvedInput = path.resolve(inputPath);
      const basename = path.basename(resolvedInput);

      if (!isPdfFilename(basename)) {
        console.error(`${basename}: only .pdf files can be merged.`);
        process.exit(1);
      }

      let buffer: Buffer;
      try {
        buffer = await readFile(resolvedInput);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        console.error(`${basename}: ${message}`);
        process.exit(1);
      }

      if (await isPdfEncrypted(buffer)) {
        let decrypted: Buffer | null = null;
        while (!decrypted) {
          const password = await promptPassword(basename);
          try {
            decrypted = await preparePdfForMerge(buffer, password);
          } catch (error) {
            if (
              error instanceof ConversionError &&
              error.code === "MERGE_PASSWORD"
            ) {
              console.error("Incorrect password, try again.");
              continue;
            }
            throw error;
          }
        }
        buffer = decrypted;
      }

      buffers.push(buffer);
    }

    try {
      const merged = await mergePdfs(buffers);
      const outputPath = path.resolve(options.output);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, merged);
      console.log(`Wrote ${outputPath}`);
      process.exit(0);
    } catch (error) {
      if (error instanceof ConversionError) {
        console.error(error.message);
      } else if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(String(error));
      }
      process.exit(1);
    }
  });

program.parse();
