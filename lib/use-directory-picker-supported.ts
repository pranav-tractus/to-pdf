"use client";

import { useEffect, useState } from "react";

import { supportsDirectoryPicker } from "@/lib/save-pdf";

export function useDirectoryPickerSupported(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(supportsDirectoryPicker());
  }, []);

  return supported;
}
