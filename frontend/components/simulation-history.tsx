"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CheckCircle2, XCircle, Clock, Loader2, Eye } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { listSimulations, getInstanceDetails, type SimulationResult } from "@/lib/api"
import { useResultStore } from "@/hooks/use-result-store"
import { useFileStore } from "@/hooks/use-file-store"
import { useToast } from "@/hooks/use-toast"
import type { TestFile, AlgorithmResult, PackagePosition } from "@/lib/types"

interface SimulationHistoryProps {
  onViewSimulation?: () => void
}

export function SimulationHistory({ onViewSimulation }: SimulationHistoryProps) {
  const [simulations, setSimulations] = useState<SimulationResult[]>([])
  const [loading, setLoading] = useState(true)
  const { setResult } = useResultStore()
  const { addFile, selectFile, files } = useFileStore()
  const { toast } = useToast()
  const [viewingSim, setViewingSim] = useState<string | null>(null)

  useEffect(() => {
    loadSimulations()
  }, [])

  const loadSimulations = async () => {
    try {
      const data = await listSimulations()
      setSimulations(data)
    } catch (error) {
      console.error("Failed to load simulations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewResult = async (sim: SimulationResult) => {
      if (!sim.result || sim.status !== 'completed') return;
      
      setViewingSim(sim.job_id)
      try {
          // 1. Ensure we have the file context
          const filename = sim.request.filename;
          let targetFile = files.find(f => f.name === filename);

          if (!targetFile) {
              // Fetch instance details to recreate the file object
              const details = await getInstanceDetails(filename);
              targetFile = {
                  id: `history-${sim.job_id}`, // Unique ID for this historical view
                  name: filename,
                  truckDimensions: {
                      width: details.vehicle_L,
                      height: details.vehicle_H, // Map H to height
                      depth: details.vehicle_W   // Map W to depth
                  },
                  packages: details.items.map(i => ({
                      id: i.id,
                      width: i.width,
                      height: i.depth, // Map H (backend depth) to height
                      depth: i.height, // Map W (backend height) to depth
                      deliveryOrder: i.delivery_order
                  })),
                  uploadedAt: new Date()
              };
              addFile(targetFile);
          }
          
          const fileId = targetFile.id;

          // 2. Select the file
          selectFile(fileId);

          // 3. Construct and set the result
           const algoResult: AlgorithmResult = {
               status: sim.result.solution_status === 'SAT' ? 'SAT' : 'UNSAT',
               trucksUsed: sim.result.num_vehicles || 0,
               executionTime: sim.result.duration,
               placements: (sim.result.items || []).map((item: any) => {
                   const pkg = targetFile!.packages?.find(p => p.id === item.id);
                   return {
                       id: item.id,
                       width: item.width,
                       height: item.depth, // Swap W/H to match frontend convention
                       depth: item.height, // Swap W/H to match frontend convention
                       deliveryOrder: pkg?.deliveryOrder ?? -1,
                       truckId: item.vehicle_id !== undefined ? Number(item.vehicle_id) : (item.vehicle !== undefined ? Number(item.vehicle) : 0),
                       minPoint: [item.x, item.y, item.z],
                       maxPoint: [item.x + item.width, item.y + item.height, item.z + item.depth]
                   } as PackagePosition;
               })
           };
           
           setResult(fileId, algoResult);
           
           if (onViewSimulation) {
             onViewSimulation();
           }

           toast({
               title: "Simulation Loaded",
               description: `Loaded results for ${filename}`,
           })

      } catch (error) {
          console.error("Failed to load simulation details", error);
          toast({
              title: "Error",
              description: "Failed to load simulation details",
              variant: "destructive"
          })
      } finally {
          setViewingSim(null)
      }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Simulation History</h2>
        <Button variant="outline" size="sm" onClick={loadSimulations}>Refresh</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Solver</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {simulations.map((sim) => (
              <TableRow key={sim.job_id}>
                <TableCell>
                  {sim.status === 'completed' ? (
                     sim.result?.solution_status === 'SAT' ? (
                        <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1"/> SAT</Badge>
                     ) : (
                        <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> UNSAT</Badge>
                     )
                  ) : sim.status === 'failed' ? (
                     <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Failed</Badge>
                  ) : (
                     <Badge variant="secondary"><Clock className="w-3 h-3 mr-1"/> {sim.status}</Badge>
                  )}
                </TableCell>
                <TableCell>{sim.request?.filename}</TableCell>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{sim.request?.solver}</span>
                        <span className="text-xs text-muted-foreground">{sim.request?.heuristic}</span>
                    </div>
                </TableCell>
                <TableCell>{format(new Date(sim.submit_time), 'MMM d, HH:mm:ss')}</TableCell>
                <TableCell>
                    {sim.result?.duration ? `${sim.result.duration.toFixed(2)}s` : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleViewResult(sim)}
                    disabled={viewingSim === sim.job_id || sim.status !== 'completed'}
                  >
                    {viewingSim === sim.job_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
