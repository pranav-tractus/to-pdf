import { NextResponse } from "next/server";

import {
  convertToPdf,
  ConversionError,
  MAX_FILE_SIZE_BYTES,
  pdfOutputName,
} from "@/src/lib/convert";
import { isSupportedFilename } from "@/src/lib/supported";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file field in form data." },
        { status: 400 },
      );
    }

    if (!isSupportedFilename(file.name)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.name}` },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 50MB limit." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdf = await convertToPdf(buffer, file.name);
    const outputName = pdfOutputName(file.name);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outputName}"`,
      },
    });
  } catch (error) {
    if (error instanceof ConversionError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Conversion failed unexpectedly." },
      { status: 500 },
    );
  }
}
