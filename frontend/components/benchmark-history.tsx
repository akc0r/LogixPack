"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CheckCircle2, XCircle, Clock, Loader2, Eye, FileText } from "lucide-react"
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
import { listBenchmarks, type BenchmarkResult } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

import { BenchmarkResultsTable } from "@/components/benchmark-results-table"

export function BenchmarkHistory() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkResult | null>(null)

  useEffect(() => {
    loadBenchmarks()
  }, [])

  const loadBenchmarks = async () => {
    try {
      const data = await listBenchmarks()
      setBenchmarks(data)
    } catch (error) {
      console.error("Failed to load benchmarks:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Benchmark History</h3>
        <Button variant="outline" size="sm" onClick={loadBenchmarks}>
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Solvers</TableHead>
              <TableHead>Files</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {benchmarks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No benchmarks found.
                </TableCell>
              </TableRow>
            ) : (
              benchmarks.map((bench) => (
                <TableRow key={bench.job_id}>
                  <TableCell>
                    {bench.status === "completed" ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Completed
                      </Badge>
                    ) : bench.status === "failed" ? (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Failed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        {bench.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(bench.submit_time), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {bench.summary && Object.keys(bench.summary).filter(k => k !== 'error').map(solver => (
                        <Badge key={solver} variant="outline">{solver}</Badge>
                      ))}
                      {!bench.summary && (bench as any).request?.solvers?.map((s: string) => (
                         <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {(bench as any).request?.files?.length 
                        ? `${(bench as any).request.files.length} files` 
                        : (bench as any).request?.test_dir || "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedBenchmark(bench)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Benchmark Results</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh]">
                          <BenchmarkResultsTable summary={bench.summary} />
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
