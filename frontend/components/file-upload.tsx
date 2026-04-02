"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseInputFile, validateTestFile } from "@/lib/file-parser"
import { useFileStore } from "@/hooks/use-file-store"
import { uploadInstance } from "@/lib/api"

export function FileUpload() {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addFile = useFileStore((state) => state.addFile)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return

      setError(null)

      Array.from(files).forEach((file) => {
        const reader = new FileReader()

        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string
            const testFile = parseInputFile(content, file.name)

            // Validate the file
            const errors = validateTestFile(testFile)
            if (errors.length > 0) {
              setError(`${file.name}: ${errors.join(", ")}`)
              return
            }

            // Upload to backend
            try {
              await uploadInstance(file)
              testFile.isBackend = true
              addFile(testFile)
            } catch (uploadErr) {
              setError(`${file.name}: Failed to upload to backend`)
            }
            
          } catch (err) {
            setError(`${file.name}: ${err instanceof Error ? err.message : "Failed to parse file"}`)
          }
        }

        reader.onerror = () => {
          setError(`${file.name}: Failed to read file`)
        }

        reader.readAsText(file)
      })
    },
    [addFile],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault()
      handleFiles(e.target.files)
    },
    [handleFiles],
  )

  return (
    <div className="space-y-4">
      <Card
        className={`relative border-2 border-dashed transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <label className="flex cursor-pointer flex-col items-center justify-center p-12 text-center">
          <input
            type="file"
            multiple
            accept=".txt,.dat"
            onChange={handleChange}
            className="sr-only"
            aria-label="Upload test files"
          />
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Upload Test Files</h3>
          <p className="mb-4 text-sm text-muted-foreground">Drag and drop your test files here, or click to browse</p>
          <Button type="button" variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Select Files
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">Supports .txt and .dat files</p>
        </label>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
