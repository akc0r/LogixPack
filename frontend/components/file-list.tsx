"use client"

import { useEffect } from "react"
import { Trash2, FileText, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFileStore } from "@/hooks/use-file-store"
import { calculateFileStatistics } from "@/lib/calculations"
import { listInstances, deleteInstance } from "@/lib/api"

export function FileList() {
  const { files, selectedFileId, selectFile, removeFile, syncBackendFiles } = useFileStore()

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const instances = await listInstances()
        syncBackendFiles(instances)
      } catch (e) {
        console.error("Failed to fetch instances", e)
      }
    }
    fetchFiles()
  }, []) // Run once on mount

  if (files.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto mb-3 w-fit rounded-full bg-muted p-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No files uploaded yet</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {files.map((file) => {
        const stats = calculateFileStatistics(file)
        const isSelected = file.id === selectedFileId

        return (
          <Card
            key={file.id}
            className={`cursor-pointer p-4 transition-all hover:border-primary/50 ${
              isSelected ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => selectFile(file.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-foreground">{file.name}</h3>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  {file.isBackend && <Badge variant="outline" className="text-[10px]">Server</Badge>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {stats.totalPackages} packages
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Min {stats.minTrucksTheoretical} trucks
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Truck: {file.truckDimensions.width}×{file.truckDimensions.height}×{file.truckDimensions.depth}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  Uploaded {new Date(file.uploadedAt).toLocaleDateString()} at {new Date(file.uploadedAt).toLocaleTimeString()}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={async (e) => {
                  e.stopPropagation()
                  if (file.isBackend) {
                    try {
                      await deleteInstance(file.name)
                    } catch (error) {
                      console.error("Failed to delete file from backend:", error)
                      return
                    }
                  }
                  removeFile(file.id)
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
