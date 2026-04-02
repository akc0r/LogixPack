"use client";

import {
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  Clock,
  BarChart3,
  Box,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFileStore } from "@/hooks/use-file-store";
import { useResultStore } from "@/hooks/use-result-store";
import { organizeTruckData } from "@/lib/calculations";
import { TruckViewer3D } from "@/components/truck-viewer-3d";

export function ResultsSummary() {
  const { selectedFileId, files } = useFileStore();
  const { getResult } = useResultStore();

  const selectedFile = files.find((f) => f.id === selectedFileId);
  const result = selectedFile ? getResult(selectedFile.id) : undefined;

  if (!result) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto mb-3 w-fit rounded-full bg-muted p-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Run a simulation to see results
        </p>
      </Card>
    );
  }

  if (result.status === "UNSAT") {
    return (
      <Card className="border-destructive/50 bg-destructive/5 p-8 text-center">
        <div className="mx-auto mb-4 w-fit rounded-full bg-destructive/10 p-4">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-destructive">
          No Solution Found
        </h3>
        <p className="text-sm text-muted-foreground">
          The algorithm could not find a valid packing solution for this
          configuration
        </p>
      </Card>
    );
  }

  const trucks = organizeTruckData(
    result.placements,
    selectedFile!.truckDimensions
  );
  const avgFillPercentage =
    trucks.reduce((sum, truck) => sum + truck.fillPercentage, 0) /
    trucks.length;

  return (
    <div className="space-y-4">
      {/* Success Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Solution Found
            </h3>
            <p className="text-sm text-muted-foreground">
              Successfully packed all items
            </p>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Trucks Used</p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {result.trucksUsed}
              </p>
            </div>
            <div className="rounded-full bg-chart-1/10 p-3">
              <Truck className="h-6 w-6 text-chart-1" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Items Packed</p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {result.placements.length}
              </p>
            </div>
            <div className="rounded-full bg-chart-2/10 p-3">
              <Package className="h-6 w-6 text-chart-2" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Fill Rate</p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {avgFillPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-full bg-chart-3/10 p-3">
              <BarChart3 className="h-6 w-6 text-chart-3" />
            </div>
          </div>
        </Card>
      </div>

      {/* Execution Time */}
      {result.executionTime && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Execution Time</p>
              <p className="text-lg font-semibold text-foreground">
                {result.executionTime}ms
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Truck Details */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Truck Details
        </h3>

        <div className="space-y-4">
          {trucks.map((truck, idx) => (
            <Card key={truck.id ?? idx} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                    {typeof truck.id === "number" ? truck.id + 1 : "?"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Truck {typeof truck.id === "number" ? truck.id + 1 : "?"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {truck.packages.length} packages
                    </p>
                  </div>
                </div>
                <Badge
                  variant={truck.fillPercentage > 80 ? "default" : "secondary"}
                >
                  {truck.fillPercentage.toFixed(1)}% filled
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Used: {truck.usedVolume.toLocaleString()} /{" "}
                    {truck.totalVolume.toLocaleString()}
                  </span>
                  <span>{truck.fillPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={truck.fillPercentage} className="h-2" />
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {truck.packages.map((pkg, pIdx) => (
                  <Badge
                    key={`${pkg.id}-${pIdx}`}
                    variant="outline"
                    className="text-xs"
                  >
                    #{pkg.id}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full gap-2" size="lg">
            <Box className="h-4 w-4" />
            Visualize 3D Solution
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-7xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>3D Visualization</DialogTitle>
          </DialogHeader>
          <div className="h-full w-full overflow-y-auto">
            <TruckViewer3D />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
