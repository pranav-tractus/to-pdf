"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface PdfPasswordDialogProps {
  open: boolean;
  filename: string;
  onCancel: () => void;
  onSubmit: (password: string) => void;
}

export function PdfPasswordDialog({
  open,
  filename,
  onCancel,
  onSubmit,
}: PdfPasswordDialogProps) {
  const [password, setPassword] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>PDF password required</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{filename}</span> is encrypted. Enter
            the password to include it in the merge.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="pdf-password">Password</FieldLabel>
            <Input
              id="pdf-password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && password) onSubmit(password);
              }}
            />
            <FieldDescription>
              Password is used locally for this merge only.
            </FieldDescription>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!password}
            onClick={() => onSubmit(password)}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
