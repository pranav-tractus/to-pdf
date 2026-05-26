"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { DropZone } from "@/components/drop-zone";
import { FileQueue } from "@/components/file-queue";
import { OutputFolder } from "@/components/output-folder";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  convertFileViaApi,
  outputPdfName,
  type QueueItem,
} from "@/lib/convert-client";
import {
  downloadPdfBlob,
  savePdfToDirectory,
} from "@/lib/save-pdf";
import { useDirectoryPickerSupported } from "@/lib/use-directory-picker-supported";
import { LIBREOFFICE_INSTALL_HINT } from "@/src/lib/errors";

function newId(): string {
  return crypto.randomUUID();
}

export function ConverterApp() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  const pendingCount = useMemo(
    () => items.filter((i) => i.status === "pending").length,
    [items],
  );

  const fsaSupported = useDirectoryPickerSupported();
  const canConvert =
    pendingCount > 0 &&
    !isConverting &&
    (!fsaSupported || directoryHandle !== null);

  const onFilesAdded = useCallback((files: File[]) => {
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: newId(),
        file,
        status: "pending" as const,
      })),
    ]);
  }, []);

  const onRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const onPickFolder = useCallback(async () => {
    try {
      const handle = await window.showDirectoryPicker!();
      setDirectoryHandle(handle);
      setFolderName(handle.name);
    } catch {
      // user cancelled picker
    }
  }, []);

  const updateItem = useCallback(
    (id: string, patch: Partial<QueueItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const onConvertAll = useCallback(async () => {
    const pending = items.filter((i) => i.status === "pending");
    if (!pending.length) return;

    setIsConverting(true);
    setProgress(0);

    let completed = 0;
    let savedCount = 0;
    const useDownloadFallback = !fsaSupported || !directoryHandle;

    for (const item of pending) {
      updateItem(item.id, { status: "converting", error: undefined });

      try {
        const blob = await convertFileViaApi(item.file);
        const pdfName = outputPdfName(item.file.name);

        if (useDownloadFallback) {
          downloadPdfBlob(blob, pdfName);
        } else {
          await savePdfToDirectory(directoryHandle!, pdfName, blob);
        }

        updateItem(item.id, { status: "done" });
        savedCount += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Conversion failed";
        updateItem(item.id, { status: "error", error: message });
      }

      completed += 1;
      setProgress(Math.round((completed / pending.length) * 100));
    }

    setIsConverting(false);

    if (savedCount > 0) {
      if (useDownloadFallback) {
        toast.success(`Downloaded ${savedCount} PDF${savedCount === 1 ? "" : "s"}`);
      } else {
        toast.success(
          `Saved ${savedCount} PDF${savedCount === 1 ? "" : "s"} to ${folderName}`,
        );
      }
    }
  }, [directoryHandle, folderName, fsaSupported, items, updateItem]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">to-pdf</h1>
        <p className="text-muted-foreground">
          Convert DOCX and images to PDF on your machine.
        </p>
      </div>

      <Alert>
        <AlertTitle>DOCX requires LibreOffice</AlertTitle>
        <AlertDescription>
          {LIBREOFFICE_INSTALL_HINT}. First conversion may take a few seconds.
        </AlertDescription>
      </Alert>

      <DropZone onFilesAdded={onFilesAdded} disabled={isConverting} />

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Output location</h2>
        <OutputFolder
          folderName={folderName}
          onPickFolder={onPickFolder}
          disabled={isConverting}
        />
      </section>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Queue</h2>
          <Button
            type="button"
            disabled={!canConvert}
            onClick={onConvertAll}
          >
            {isConverting ? "Converting…" : "Convert all"}
          </Button>
        </div>

        {isConverting && <Progress value={progress} />}

        <FileQueue items={items} onRemove={onRemove} />
      </section>
    </div>
  );
}
