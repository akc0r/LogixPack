"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface BenchmarkResultsTableProps {
  summary: any
}

export function BenchmarkResultsTable({ summary }: BenchmarkResultsTableProps) {
  const flattenResults = (summary: any) => {
    const flat: any[] = []
    if (!summary) return []
    
    Object.entries(summary).forEach(([solver, heuristics]: [string, any]) => {
      if (solver === 'error') return
      Object.entries(heuristics).forEach(([heuristicKey, results]: [string, any[]]) => {
        results.forEach((res) => {
          flat.push({
            solver,
            heuristic: heuristicKey === solver ? '-' : heuristicKey.replace(`${solver}_`, ''),
            instance: res.instance || 'Unknown',
            status: res.status,
            duration: res.duration,
            vehicles: res.num_vehicles,
            error: res.error
          })
        })
      })
    })
    return flat.sort((a, b) => a.instance.localeCompare(b.instance))
  }

  if (!summary) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No results available.
      </div>
    )
  }

  if (summary.error) {
    return (
      <div className="p-4 text-center text-destructive">
        Error: {summary.error}
      </div>
    )
  }

  const results = flattenResults(summary)

  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No benchmark results found.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Instance</TableHead>
          <TableHead>Solver</TableHead>
          <TableHead>Heuristic</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Duration (s)</TableHead>
          <TableHead className="text-right">Vehicles</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((res, idx) => (
          <TableRow key={idx}>
            <TableCell className="font-medium">{res.instance}</TableCell>
            <TableCell>{res.solver}</TableCell>
            <TableCell>{res.heuristic}</TableCell>
            <TableCell>
              {res.status === "SAT" ? (
                <Badge className="bg-green-500 hover:bg-green-600">SAT</Badge>
              ) : res.status === "UNSAT" ? (
                <Badge variant="destructive">UNSAT</Badge>
              ) : (
                <Badge variant="secondary">{res.status}</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              {typeof res.duration === 'number' ? res.duration.toFixed(4) : '-'}
            </TableCell>
            <TableCell className="text-right">
              {res.vehicles || '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
