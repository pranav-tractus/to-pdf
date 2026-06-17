"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ACCEPT_ATTRIBUTE, isSupportedFilename } from "@/src/lib/supported";

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
  accept?: string;
  isValidFile?: (filename: string) => boolean;
  title?: string;
  description?: string;
}

export function DropZone({
  onFilesAdded,
  disabled,
  accept = ACCEPT_ATTRIBUTE,
  isValidFile = isSupportedFilename,
  title = "Drop files here",
  description = "DOCX and images (PNG, JPG, WebP, GIF, TIFF, BMP). Max 50MB per file.",
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      const valid = Array.from(fileList).filter((f) => isValidFile(f.name));
      if (valid.length) onFilesAdded(valid);
    },
    [isValidFile, onFilesAdded],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      addFiles(event.dataTransfer.files);
    },
    [addFiles, disabled],
  );

  return (
    <Card
      className={cn(
        "border-dashed transition-colors",
        isDragging && "border-primary bg-muted/50",
        disabled && "opacity-60",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-8">
        <Upload className="size-10 text-muted-foreground" />
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={accept}
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </Button>
      </CardContent>
    </Card>
  );
}
