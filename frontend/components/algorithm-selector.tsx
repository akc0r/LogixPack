"use client"

import { useState } from "react"
import { Play, Cpu, Zap, Brain, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useFileStore } from "@/hooks/use-file-store"
import { useResultStore } from "@/hooks/use-result-store"
import type { AlgorithmOption, AlgorithmType, AlgorithmResult, PackagePosition } from "@/lib/types"
import { runSimulation, getSimulationResult } from "@/lib/api"

const algorithms: AlgorithmOption[] = [
  {
    id: "cp",
    name: "Constraint Programming",
    description: "Exact solver using OR-Tools CP-SAT. Guarantees optimal solution but may be slower.",
  },
  {
    id: "adhoc1",
    name: "First Fit Decreasing",
    description: "Fast greedy heuristic. Sorts items by volume and places them in the first available spot.",
  },
  {
    id: "adhoc2",
    name: "Free Space Splitting",
    description: "Advanced heuristic that manages free space as a set of empty cuboids.",
  },
]

const algorithmIcons: Record<string, any> = {
  cp: Brain,
  adhoc1: Zap,
  adhoc2: Cpu,
}

interface AlgorithmSelectorProps {
  onSimulationComplete?: () => void
}

export function AlgorithmSelector({ onSimulationComplete }: AlgorithmSelectorProps) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("cp")
  const { selectedFileId, files } = useFileStore()
  const { isRunning, setRunning, setResult } = useResultStore()

  const selectedFile = files.find((f) => f.id === selectedFileId)

  const handleRun = async () => {
    if (!selectedFile) return

    setRunning(true, selectedAlgorithm)

    try {
      let solver = 'cp';
      let heuristic = undefined;
      if (selectedAlgorithm === 'adhoc1') {
          solver = 'adhoc';
          heuristic = 'ffd';
      } else if (selectedAlgorithm === 'adhoc2') {
          solver = 'adhoc';
          heuristic = 'free_space';
      }

      const job = await runSimulation(selectedFile.name, solver, heuristic);
      
      // Poll for result
      let result = await getSimulationResult(job.job_id);
      while (result.status === 'pending' || result.status === 'running') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          result = await getSimulationResult(job.job_id);
      }

      if (result.status === 'completed' && result.result) {
           const algoResult: AlgorithmResult = {
               status: result.result.solution_status === 'SAT' ? 'SAT' : 'UNSAT',
               trucksUsed: result.result.num_vehicles || 0,
               executionTime: result.result.duration,
               placements: (result.result.items || []).map((item: any, index: number) => {
                   // Try to map back to original package if possible
                   const original = selectedFile.packages[index] || { id: index, deliveryOrder: 0 };
                   return {
                       id: original.id,
                       width: item.width,
                       height: item.depth,
                       depth: item.height,
                       deliveryOrder: original.deliveryOrder,
                       truckId: item.vehicle_id !== undefined ? Number(item.vehicle_id) : (item.vehicle !== undefined ? Number(item.vehicle) : 0),
                       minPoint: [item.x, item.y, item.z],
                       maxPoint: [item.x + item.width, item.y + item.height, item.z + item.depth]
                   } as PackagePosition;
               })
           };
           
           setResult(selectedFile.id, algoResult);
           
           if (onSimulationComplete) {
             onSimulationComplete();
           }
      } else {
          console.error("Simulation failed", result);
      }

    } catch (error) {
      console.error(error)
    } finally {
      setRunning(false)
    }
  }

  if (!selectedFile) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto mb-3 w-fit rounded-full bg-muted p-3">
          <Cpu className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Select a file to run algorithms</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Select Algorithm</h3>

        <div className="space-y-3">
          {algorithms.map((algo) => {
            const Icon = algorithmIcons[algo.id]
            const isSelected = selectedAlgorithm === algo.id

            return (
              <Card
                key={algo.id}
                className={`cursor-pointer p-4 transition-all hover:border-primary/50 ${
                  isSelected ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setSelectedAlgorithm(algo.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{algo.name}</h4>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{algo.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Button onClick={handleRun} disabled={isRunning} className="mt-6 w-full" size="lg">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Running {algorithms.find((a) => a.id === selectedAlgorithm)?.name}...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Run Simulation
            </>
          )}
        </Button>
      </Card>
    </div>
  )
}
