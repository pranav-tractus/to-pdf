"use client";

import { FolderOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDirectoryPickerSupported } from "@/lib/use-directory-picker-supported";

interface OutputFolderProps {
  folderName: string | null;
  onPickFolder: () => void;
  disabled?: boolean;
}

export function OutputFolder({
  folderName,
  onPickFolder,
  disabled,
}: OutputFolderProps) {
  const fsaSupported = useDirectoryPickerSupported();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={disabled || !fsaSupported}
        onClick={onPickFolder}
      >
        <FolderOpen className="size-4" />
        Choose output folder
      </Button>
      {folderName ? (
        <Badge variant="secondary">{folderName}</Badge>
      ) : fsaSupported ? (
        <p className="text-sm text-muted-foreground">
          Pick where PDFs are saved on your computer
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Folder picker unavailable — files will download instead
        </p>
      )}
    </div>
  );
}
