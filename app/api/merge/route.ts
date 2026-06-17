import { NextResponse } from "next/server";

import { ConversionError } from "@/src/lib/errors";
import { mergePdfs } from "@/src/lib/merge-pdfs";
import {
  isPdfFilename,
  MAX_FILE_SIZE_BYTES,
  MIN_MERGE_PDF_COUNT,
  normalizeMergedFilename,
} from "@/src/lib/supported";

export const runtime = "nodejs";

type PasswordMap = Record<string, string>;

function parsePasswords(raw: FormDataEntryValue | null): PasswordMap {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: PasswordMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.length > 0) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);
    const fileIds = formData
      .getAll("fileIds")
      .filter((id): id is string => typeof id === "string");
    const outputNameRaw = formData.get("outputName");
    const passwordMap = parsePasswords(formData.get("passwords"));

    if (files.length < MIN_MERGE_PDF_COUNT) {
      return NextResponse.json(
        { error: `At least ${MIN_MERGE_PDF_COUNT} PDF files are required.` },
        { status: 400 },
      );
    }

    if (fileIds.length !== files.length) {
      return NextResponse.json(
        { error: "fileIds must match files count." },
        { status: 400 },
      );
    }

    const outputName = normalizeMergedFilename(
      typeof outputNameRaw === "string" ? outputNameRaw : "",
    );

    for (const file of files) {
      if (!isPdfFilename(file.name)) {
        return NextResponse.json(
          { error: `Only PDF files are supported: ${file.name}` },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File exceeds 50MB limit: ${file.name}` },
          { status: 400 },
        );
      }
    }

    const buffers: Buffer[] = [];
    const passwords: (string | undefined)[] = [];

    for (let i = 0; i < files.length; i += 1) {
      buffers.push(Buffer.from(await files[i].arrayBuffer()));
      passwords.push(passwordMap[fileIds[i]]);
    }

    const pdf = await mergePdfs(buffers, passwords);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outputName}"`,
      },
    });
  } catch (error) {
    if (error instanceof ConversionError) {
      return NextResponse.json(
        {
          error: error.message,
          code:
            error.code === "MERGE_PASSWORD" ? "PASSWORD_REQUIRED" : "MERGE",
        },
        { status: 422 },
      );
    }

    console.error("Merge error:", error);
    return NextResponse.json(
      { error: "Merge failed unexpectedly." },
      { status: 500 },
    );
  }
}
