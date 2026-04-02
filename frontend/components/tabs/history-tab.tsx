"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimulationHistory } from "@/components/simulation-history"
import { BenchmarkHistory } from "@/components/benchmark-history"

interface HistoryTabProps {
  setIsResultModalOpen: (open: boolean) => void
}

export function HistoryTab({ setIsResultModalOpen }: HistoryTabProps) {
  return (
    <Tabs defaultValue="simulations" className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
        <TabsTrigger value="simulations">Simulations</TabsTrigger>
        <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
      </TabsList>
      <TabsContent value="simulations" className="mt-4">
        <SimulationHistory onViewSimulation={() => {
          setIsResultModalOpen(true)
        }} />
      </TabsContent>
      <TabsContent value="benchmarks" className="mt-4">
        <BenchmarkHistory />
      </TabsContent>
    </Tabs>
  )
}
