"use client"

import { useState } from "react"
import { Grid } from "@react-three/drei"
import { organizeTruckData, getPackageColor } from "@/lib/calculations"
import { PackageBox } from "./package-box"
import { TruckContainer } from "./truck-container"

interface TruckSceneProps {
  truckId: number
  truckData: ReturnType<typeof organizeTruckData>[0]
  selectedPackageId: number | null
  onPackageClick: (id: number) => void
}

export function TruckScene({
  truckId,
  truckData,
  selectedPackageId,
  onPackageClick,
}: TruckSceneProps) {
  
  // Map dimensions to Three.js coordinates
  // Input: width=L, height=H, depth=W
  // Three.js: X=L, Y=H (Up), Z=W
  const truckDims: [number, number, number] = [
    truckData.dimensions.width,  // X = L
    truckData.dimensions.height, // Y = H (Up)
    truckData.dimensions.depth   // Z = W
  ]

  return (
    <>
      <axesHelper args={[Math.max(...truckDims) + 10]} />
      
      {/* Truck outline */}
      <group>
        <TruckContainer
          dimensions={truckDims}
        />
      </group>

      {/* Packages */}
      {truckData.packages.map((pkg) => (
        <PackageBox
          key={pkg.id}
          // Coordinates: [x, y, z] -> [L, H, W]
          // Backend returns [x, y, z] as [L, W, H]
          position={[pkg.minPoint[0], pkg.minPoint[2], pkg.minPoint[1]]}
          // Dimensions: [width, height, depth] -> [L, H, W]
          dimensions={[pkg.width, pkg.height, pkg.depth]}
          color={getPackageColor(pkg.id)}
          packageId={pkg.id}
          selected={selectedPackageId === pkg.id}
          onClick={() => onPackageClick(pkg.id)}
        />
      ))}

      {/* Ground plane */}
      <Grid
        args={[truckDims[0] * 2, truckDims[2] * 2]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#2a2a3e"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#3a3a4e"
        fadeDistance={100}
        fadeStrength={1}
        position={[truckDims[0] / 2, -0.01, truckDims[2] / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </>
  )
}
