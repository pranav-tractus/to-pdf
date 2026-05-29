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

Open [http://localhost:1500](http://localhost:1500).

1. Drop or choose files (DOCX or images: PNG, JPG, JPEG, WebP, GIF, TIFF, BMP).
2. Click **Choose output folder** (Chrome/Edge). PDFs are written directly into that folder.
3. Click **Convert all**.

### Merge PDFs

Open [http://localhost:1500/merge](http://localhost:1500/merge) or use **Merge PDFs** in the nav.

1. Drop or choose at least two PDF files. Drag the handle to reorder (page order in the output).
2. Set the output filename (defaults to `merged.pdf`).
3. Choose output folder (or download). Encrypted PDFs prompt for a password in the browser.
4. Click **Merge PDFs**.

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

```bash
# Merge PDFs (prompts for password if a file is encrypted)
npm run cli -- merge chapter1.pdf chapter2.pdf -o book.pdf
```

## Supported formats

| Type   | Extensions                                      |
|--------|-------------------------------------------------|
| Word   | `.docx`                                         |
| Images | `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.tiff`, `.tif`, `.bmp` |
| PDF merge | `.pdf` (2+ files, 50MB each; password-protected PDFs supported) |

Max upload size: 50MB per file.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start web app (dev)      |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run cli`  | Run CLI via tsx          |
| `npm test`     | Run Vitest unit tests    |

## Local-only

This app is intended to run on your machine (`npm run dev` or `npm start`). Conversion uses LibreOffice and Sharp on the server; deploy to serverless hosts only with extra configuration.
