"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TestFile } from "@/lib/types";
import type { InstanceStats } from "@/lib/api";

interface FileStore {
  files: TestFile[];
  selectedFileId: string | null;
  addFile: (file: TestFile) => void;
  updateFile: (fileId: string, updates: Partial<TestFile>) => void;
  removeFile: (fileId: string) => void;
  selectFile: (fileId: string | null) => void;
  clearFiles: () => void;
  syncBackendFiles: (instances: InstanceStats[]) => void;
}

export const useFileStore = create<FileStore>()(
  persist(
    (set) => ({
      files: [],
      selectedFileId: null,
      addFile: (file) =>
        set((state) => {
          if (state.files.some((f) => f.id === file.id)) {
            return state;
          }
          return { files: [...state.files, file] };
        }),
      updateFile: (fileId, updates) =>
        set((state) => ({
          files: state.files.map((f) => (f.id === fileId ? { ...f, ...updates } : f)),
        })),
      removeFile: (fileId) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== fileId),
          selectedFileId:
            state.selectedFileId === fileId ? null : state.selectedFileId,
        })),
      selectFile: (fileId) => set({ selectedFileId: fileId }),
      clearFiles: () => set({ files: [], selectedFileId: null }),
      syncBackendFiles: (instances) =>
        set((state) => {
          // 1. Deduplicate existing files based on ID
          const uniqueFiles = new Map<string, TestFile>();
          state.files.forEach((f) => uniqueFiles.set(f.id, f));

          // 2. Add new instances
          instances.forEach((inst) => {
            if (!uniqueFiles.has(inst.filename)) {
              uniqueFiles.set(inst.filename, {
                id: inst.filename,
                name: inst.filename,
                truckDimensions: {
                  width: inst.vehicle_W,
                  height: inst.vehicle_H,
                  depth: inst.vehicle_L,
                },
                uploadedAt: new Date(),
                isBackend: true,
                numItems: inst.num_items,
              });
            }
          });

          return { files: Array.from(uniqueFiles.values()) };
        }),
    }),
    {
      name: "file-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
