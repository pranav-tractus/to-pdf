# to-pdf

Convert DOCX and image files to PDF. Runs as a local Next.js web app (drag and drop) or a CLI.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [LibreOffice](https://www.libreoffice.org/) (required for `.docx` conversion)

```bash
brew install --cask libreoffice
```

The first DOCX conversion may take several seconds while LibreOffice initializes.

## Web app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Drop or choose files (DOCX or images: PNG, JPG, JPEG, WebP, GIF, TIFF, BMP).
2. Click **Choose output folder** (Chrome/Edge). PDFs are written directly into that folder.
3. Click **Convert all**.

**Browser notes**

- Chrome or Edge recommended for the folder picker ([File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)).
- Safari and other browsers fall back to downloading each PDF.

## CLI

```bash
# Single file
npm run cli -- report.docx -o ~/Desktop/report.pdf

# Batch to a directory
npm run cli -- ./scans/*.png --output-dir ~/Desktop/pdfs
```

After `npm link` (optional), use `to-pdf` directly:

```bash
npm link
to-pdf photo.png -o ~/Desktop/photo.pdf
```

## Supported formats

| Type   | Extensions                                      |
|--------|-------------------------------------------------|
| Word   | `.docx`                                         |
| Images | `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.tiff`, `.tif`, `.bmp` |

Max upload size: 50MB per file.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start web app (dev)      |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run cli`  | Run CLI via tsx          |

## Local-only

This app is intended to run on your machine (`npm run dev` or `npm start`). Conversion uses LibreOffice and Sharp on the server; deploy to serverless hosts only with extra configuration.
