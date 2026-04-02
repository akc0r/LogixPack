"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { AlgorithmResult, AlgorithmType } from "@/lib/types"

interface ResultStore {
  results: Record<string, AlgorithmResult> // fileId -> result
  isRunning: boolean
  currentAlgorithm: AlgorithmType | null
  setResult: (fileId: string, result: AlgorithmResult) => void
  getResult: (fileId: string) => AlgorithmResult | undefined
  setRunning: (running: boolean, algorithm?: AlgorithmType) => void
  clearResults: () => void
}

export const useResultStore = create<ResultStore>()(
  persist(
    (set, get) => ({
      results: {},
      isRunning: false,
      currentAlgorithm: null,
      setResult: (fileId, result) =>
        set((state) => ({
          results: { ...state.results, [fileId]: result },
        })),
      getResult: (fileId) => get().results[fileId],
      setRunning: (running, algorithm) =>
        set({ isRunning: running, currentAlgorithm: algorithm || null }),
      clearResults: () => set({ results: {} }),
    }),
    {
      name: "result-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ results: state.results }), // Only persist results
    }
  )
)
