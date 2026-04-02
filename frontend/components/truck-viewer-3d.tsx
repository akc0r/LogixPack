"use client";

import { Suspense, useState, useRef, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, RotateCcw, Maximize2, Box, Truck } from "lucide-react"
import { useFileStore } from "@/hooks/use-file-store"
import { useResultStore } from "@/hooks/use-result-store"
import { organizeTruckData, getPackageColor } from "@/lib/calculations"
import { TruckScene } from "./3d/truck-scene"

export function TruckViewer3D() {
  const [currentTruckIndex, setCurrentTruckIndex] = useState(0)
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null)
  const controlsRef = useRef<any>()
  const { selectedFileId, files } = useFileStore()
  const { getResult } = useResultStore()

  const selectedFile = files.find((f) => f.id === selectedFileId)
  const result = selectedFile ? getResult(selectedFile.id) : undefined

  // Reset selection when truck changes
  useEffect(() => {
    setSelectedPackageId(null)
  }, [currentTruckIndex])

  if (!result || result.status === "UNSAT" || !selectedFile) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto mb-3 w-fit rounded-full bg-muted p-3">
          <Maximize2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Run a simulation to view 3D visualization
        </p>
      </Card>
    );
  }

  const trucks = organizeTruckData(result.placements, selectedFile.truckDimensions)
  const currentTruck = trucks[currentTruckIndex]
  const selectedPackage = currentTruck?.packages.find(p => p.id === selectedPackageId)

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">3D Visualization</h3>
          <Badge variant="outline">
            Truck {currentTruckIndex + 1} of {trucks.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentTruckIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentTruckIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentTruckIndex((prev) => Math.min(trucks.length - 1, prev + 1))}
            disabled={currentTruckIndex === trucks.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset} title="Reset View">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* 3D Canvas */}
        <div className="lg:col-span-3 h-full min-h-[400px] rounded-lg border bg-gradient-to-b from-background to-muted/20 overflow-hidden relative">
          <Canvas shadows onPointerMissed={() => setSelectedPackageId(null)}>
            <PerspectiveCamera makeDefault position={[400, 400, 400]} fov={50} />
            <OrbitControls ref={controlsRef} makeDefault />
            <Environment preset="city" />
            
            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[100, 200, 100]} 
              intensity={1} 
              castShadow 
              shadow-mapSize={[2048, 2048]} 
            />

            <Suspense fallback={null}>
              {currentTruck && (
                <TruckScene 
                  truckId={currentTruck.truckId} 
                  truckData={currentTruck} 
                  selectedPackageId={selectedPackageId}
                  onPackageClick={(id) => setSelectedPackageId(id === selectedPackageId ? null : id)}
                />
              )}
            </Suspense>
          </Canvas>
          
          <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 p-1 rounded backdrop-blur-sm">
            Left Click: Rotate • Right Click: Pan • Scroll: Zoom
          </div>
        </div>

        {/* Info Panel */}
        <Card className="lg:col-span-1 flex flex-col h-full min-h-[300px] overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <h4 className="font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Truck Details
            </h4>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Truck Stats */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span className="font-medium text-right">
                    {currentTruck.dimensions.width} × {currentTruck.dimensions.height} × {currentTruck.dimensions.depth}
                  </span>
                  
                  <span className="text-muted-foreground">Total Volume:</span>
                  <span className="font-medium text-right">{currentTruck.totalVolume.toLocaleString()}</span>
                  
                  <span className="text-muted-foreground">Used Volume:</span>
                  <span className="font-medium text-right">{currentTruck.usedVolume.toLocaleString()}</span>
                  
                  <span className="text-muted-foreground">Fill Rate:</span>
                  <span className="font-medium text-right">{currentTruck.fillPercentage.toFixed(1)}%</span>
                  
                  <span className="text-muted-foreground">Packages:</span>
                  <span className="font-medium text-right">{currentTruck.packages.length}</span>
                </div>
              </div>

              <Separator />

              {/* Selected Package Stats */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <Box className="h-4 w-4" />
                  Selected Package
                </h4>
                
                {selectedPackage ? (
                  <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">#{selectedPackage.id}</Badge>
                      <div 
                        className="h-4 w-4 rounded-full border"
                        style={{ backgroundColor: getPackageColor(selectedPackage.id) }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="text-muted-foreground">Dimensions:</span>
                      <span className="font-medium text-right">
                        {selectedPackage.width} × {selectedPackage.height} × {selectedPackage.depth}
                      </span>
                      
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="font-medium text-right">
                        {(selectedPackage.width * selectedPackage.height * selectedPackage.depth).toLocaleString()}
                      </span>
                      
                      <span className="text-muted-foreground">Position:</span>
                      <span className="font-medium text-right">
                        [{selectedPackage.minPoint.join(", ")}]
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg border-dashed">
                    Click on a package in the 3D view to see details
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
