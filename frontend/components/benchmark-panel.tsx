"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { runBenchmark, getBenchmarkResult, listInstances, type InstanceStats } from "@/lib/api"
import { Loader2, Play, CheckSquare, Square } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BenchmarkResultsTable } from "@/components/benchmark-results-table"

export function BenchmarkPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [selectedSolvers, setSelectedSolvers] = useState<string[]>(["cp", "adhoc"])
  const [files, setFiles] = useState<InstanceStats[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      const data = await listInstances()
      setFiles(data)
      // Select all by default
      setSelectedFiles(data.map(f => f.filename))
    } catch (error) {
      console.error("Failed to load files:", error)
    } finally {
      setLoadingFiles(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(files.map(f => f.filename))
    }
  }

  const handleRun = async () => {
    if (selectedFiles.length === 0) return

    setIsRunning(true)
    setResults(null)
    try {
      const job = await runBenchmark(
        "tests/instances", 
        selectedSolvers, 
        ["ffd", "free_space"], 
        60,
        selectedFiles
      )
      
      let res = await getBenchmarkResult(job.job_id)
      while (res.status === 'pending' || res.status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        res = await getBenchmarkResult(job.job_id)
      }
      
      setResults(res.summary)
    } catch (e) {
      console.error(e)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Configuration Panel */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Select solvers and files to benchmark</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">Solvers</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="cp" 
                  checked={selectedSolvers.includes("cp")}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedSolvers([...selectedSolvers, "cp"])
                    else setSelectedSolvers(selectedSolvers.filter(s => s !== "cp"))
                  }}
                />
                <Label htmlFor="cp">CP Solver (Exact)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="adhoc" 
                  checked={selectedSolvers.includes("adhoc")}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedSolvers([...selectedSolvers, "adhoc"])
                    else setSelectedSolvers(selectedSolvers.filter(s => s !== "adhoc"))
                  }}
                />
                <Label htmlFor="adhoc">Ad-hoc Solvers (Heuristic)</Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Test Files ({selectedFiles.length})</Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll} className="h-8 px-2">
                {selectedFiles.length === files.length ? (
                  <><CheckSquare className="mr-2 h-3 w-3" /> Deselect All</>
                ) : (
                  <><Square className="mr-2 h-3 w-3" /> Select All</>
                )}
              </Button>
            </div>
            
            <ScrollArea className="h-[300px] rounded-md border p-2">
              {loadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.filename} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`file-${file.filename}`}
                        checked={selectedFiles.includes(file.filename)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedFiles([...selectedFiles, file.filename])
                          else setSelectedFiles(selectedFiles.filter(f => f !== file.filename))
                        }}
                      />
                      <Label htmlFor={`file-${file.filename}`} className="text-sm font-normal truncate cursor-pointer">
                        {file.filename}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <Button onClick={handleRun} disabled={isRunning || selectedFiles.length === 0} className="w-full">
            {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Run Benchmark
          </Button>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Benchmark Results</CardTitle>
          <CardDescription>Performance comparison and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {results ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4 bg-muted/50">
                  <div className="text-sm font-medium text-muted-foreground">Total Instances</div>
                  <div className="text-2xl font-bold">{selectedFiles.length}</div>
                </Card>
                <Card className="p-4 bg-muted/50">
                  <div className="text-sm font-medium text-muted-foreground">Solvers Tested</div>
                  <div className="text-2xl font-bold">{selectedSolvers.length}</div>
                </Card>
                <Card className="p-4 bg-muted/50">
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <Badge variant="default" className="bg-green-500">Completed</Badge>
                </Card>
              </div>
              
              <div className="rounded-md border">
                <ScrollArea className="h-[500px]">
                  <BenchmarkResultsTable summary={results} />
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Play className="h-8 w-8 opacity-50" />
              </div>
              <h3 className="text-lg font-semibold">No Results Yet</h3>
              <p className="text-sm max-w-sm">
                Select solvers and test files from the configuration panel and click "Run Benchmark" to see results.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
