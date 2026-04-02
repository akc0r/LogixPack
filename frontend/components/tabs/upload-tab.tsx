"use client"

import { FileUpload } from "@/components/file-upload"
import { FileList } from "@/components/file-list"
import { ManualInput } from "@/components/manual-input"
import { StatisticsPanel } from "@/components/statistics-panel"
import { AlgorithmSelector } from "@/components/algorithm-selector"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { BarChart3, Play } from "lucide-react"

interface UploadTabProps {
  isConfigDrawerOpen: boolean
  setIsConfigDrawerOpen: (open: boolean) => void
  setIsResultModalOpen: (open: boolean) => void
}

export function UploadTab({
  isConfigDrawerOpen,
  setIsConfigDrawerOpen,
  setIsResultModalOpen,
}: UploadTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Upload Test Files</h2>
          <FileUpload />
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Or Enter Manually</h2>
          <ManualInput />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Test Files</h2>
        <FileList />
        
        <div className="mt-4 flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex-1 gap-2" variant="outline">
                <BarChart3 className="h-4 w-4" />
                Statistics
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>File Statistics</DialogTitle>
              </DialogHeader>
              <StatisticsPanel />
            </DialogContent>
          </Dialog>

          <Drawer open={isConfigDrawerOpen} onOpenChange={setIsConfigDrawerOpen}>
            <DrawerTrigger asChild>
              <Button className="flex-1 gap-2">
                <Play className="h-4 w-4" />
                Solve
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-4xl p-6">
                <DrawerHeader>
                  <DrawerTitle>Run Algorithm</DrawerTitle>
                </DrawerHeader>
                <AlgorithmSelector onSimulationComplete={() => {
                  setIsConfigDrawerOpen(false)
                  setIsResultModalOpen(true)
                }} />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  )
}
