"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Truck,
  Layers,
  TrendingUp,
  Box,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useFileStore } from "@/hooks/use-file-store";
import { calculateFileStatistics } from "@/lib/calculations";
import { getInstanceDetails } from "@/lib/api";

export function StatisticsPanel() {
  const { files, selectedFileId, updateFile } = useFileStore();
  const selectedFile = files.find((f) => f.id === selectedFileId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (
        selectedFile &&
        selectedFile.isBackend &&
        !selectedFile.packages &&
        !loading
      ) {
        setLoading(true);
        try {
          const details = await getInstanceDetails(selectedFile.name);
          updateFile(selectedFile.id, {
            packages: details.items.map((item) => ({
              id: item.id,
              width: item.width,
              height: item.height,
              depth: item.depth,
              deliveryOrder: item.delivery_order,
            })),
          });
        } catch (e) {
          console.error("Failed to fetch instance details", e);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDetails();
  }, [selectedFile, updateFile, loading]);

  if (!selectedFile) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto mb-3 rounded-full bg-muted p-3">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Select a file to view statistics
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          Loading statistics...
        </span>
      </div>
    );
  }

  const stats = calculateFileStatistics(selectedFile);

  let efficiencyEstimate = 0;
  if (stats.minTrucksTheoretical > 0 && stats.truckVolume > 0) {
    efficiencyEstimate =
      (stats.totalPackageVolume /
        (stats.minTrucksTheoretical * stats.truckVolume)) *
      100;
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="mb-1 text-2xl font-bold text-foreground">
              {selectedFile.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Uploaded {new Date(selectedFile.uploadedAt).toLocaleString()}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {stats.packagesWithDeliveryOrder} ordered
          </Badge>
        </div>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div>
                <div className="rounded-full bg-chart-1/10 p-3 flex justify-center items-center">
                  <Package className="h-5 w-5 text-chart-1" />
                </div>
                <p className="text-sm text-muted-foreground">Total Packages</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {stats.totalPackages}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div>
                <div className="rounded-full bg-chart-2/10 p-3 flex justify-center items-center">
                  <Truck className="h-5 w-5 text-chart-2" />
                </div>
                <p className="text-sm text-muted-foreground">Min Trucks</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {stats.minTrucksTheoretical}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Theoretical minimum
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div>
                <div className="rounded-full bg-chart-3/10 p-3 flex justify-center items-center">
                  <Box className="h-5 w-5 text-chart-3" />
                </div>
                <p className="text-sm text-muted-foreground">Truck Volume</p>
              </div>

              <p className="mt-1 text-2xl font-bold text-foreground">
                {stats.truckVolume.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {selectedFile.truckDimensions.width}×
            {selectedFile.truckDimensions.height}×
            {selectedFile.truckDimensions.depth}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div>
                <div className="rounded-full bg-chart-4/10 p-3 flex justify-center items-center">
                  <Layers className="h-5 w-5 text-chart-4" />
                </div>
                <p className="text-sm text-muted-foreground">Avg Package</p>
              </div>

              <p className="mt-1 text-2xl font-bold text-foreground">
                {Math.round(stats.averagePackageVolume)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Average volume</p>
        </Card>
      </div>

      {/* Volume Analysis */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <TrendingUp className="h-5 w-5 text-primary" />
          Volume Analysis
        </h3>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Package Volume
              </span>
              <span className="text-sm font-medium text-foreground">
                {stats.totalPackageVolume.toLocaleString()}
              </span>
            </div>
            <Progress
              value={(stats.totalPackageVolume / stats.truckVolume) * 10}
              className="h-2"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Estimated Efficiency
              </span>
              <span className="text-sm font-medium text-foreground">
                {efficiencyEstimate.toFixed(1)}%
              </span>
            </div>
            <Progress value={efficiencyEstimate} className="h-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              Based on theoretical minimum of {stats.minTrucksTheoretical}{" "}
              trucks
            </p>
          </div>
        </div>
      </Card>

      {/* Package Details */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Package Distribution
        </h3>

        <div className="space-y-3">
          {selectedFile.packages ? (
            selectedFile.packages.slice(0, 10).map((pkg) => {
              const volume = pkg.width * pkg.height * pkg.depth;
              const volumePercent =
                stats.truckVolume > 0 ? (volume / stats.truckVolume) * 100 : 0;

              return (
                <div key={pkg.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                    {pkg.id}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {pkg.width}×{pkg.height}×{pkg.depth}
                      </span>
                      <span className="text-foreground">{volume}</span>
                    </div>
                    <Progress value={volumePercent} className="h-1" />
                  </div>
                  {pkg.deliveryOrder !== -1 && (
                    <Badge variant="outline" className="text-xs">
                      Order {pkg.deliveryOrder}
                    </Badge>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              Package details not available.
            </p>
          )}

          {selectedFile.packages && selectedFile.packages.length > 10 && (
            <p className="pt-2 text-center text-xs text-muted-foreground">
              Showing 10 of {selectedFile.packages.length} packages
            </p>
          )}
        </div>
      </Card>

      {/* Warnings */}
      {selectedFile.packages &&
        selectedFile.packages.some(
          (p) =>
            p.width > selectedFile.truckDimensions.width ||
            p.height > selectedFile.truckDimensions.height ||
            p.depth > selectedFile.truckDimensions.depth
        ) && (
          <Card className="border-destructive/50 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <h4 className="font-semibold text-destructive">Warning</h4>
                <p className="text-sm text-muted-foreground">
                  Some packages exceed truck dimensions in at least one axis
                </p>
              </div>
            </div>
          </Card>
        )}
    </div>
  );
}
