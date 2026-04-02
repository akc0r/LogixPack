"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ResultsSummary } from "@/components/results-summary"
import { Package, LineChart, Box, History } from "lucide-react"
import { UploadTab } from "@/components/tabs/upload-tab"
import { HistoryTab } from "@/components/tabs/history-tab"
import { BenchmarkTab } from "@/components/tabs/benchmark-tab"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Box className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                3D Bin Packing Solver
              </h1>
              <p className="text-sm text-muted-foreground">
                Advanced combinatorial optimization for logistics
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="upload" className="gap-2">
              <Package className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="gap-2">
              <LineChart className="h-4 w-4" />
              Benchmark
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <UploadTab 
              isConfigDrawerOpen={isConfigDrawerOpen}
              setIsConfigDrawerOpen={setIsConfigDrawerOpen}
              setIsResultModalOpen={setIsResultModalOpen}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <HistoryTab setIsResultModalOpen={setIsResultModalOpen} />
          </TabsContent>

          {/* Benchmark Tab */}
          <TabsContent value="benchmark" className="space-y-6">
            <BenchmarkTab />
          </TabsContent>
        </Tabs>

        <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
          <DialogContent className="max-w-6xl h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Simulation Results</DialogTitle>
            </DialogHeader>
            <ResultsSummary />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
