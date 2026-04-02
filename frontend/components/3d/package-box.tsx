"use client"

import { useState } from "react"
import { Html, Edges } from "@react-three/drei"

interface PackageBoxProps {
  position: [number, number, number]
  dimensions: [number, number, number]
  color: string
  packageId: number
  selected?: boolean
  onClick: () => void
}

export function PackageBox({
  position,
  dimensions,
  color,
  packageId,
  selected = false,
  onClick,
}: PackageBoxProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <mesh
      position={[position[0] + dimensions[0] / 2, position[1] + dimensions[1] / 2, position[2] + dimensions[2] / 2]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      <boxGeometry args={dimensions} />
      <meshStandardMaterial 
        color={selected ? "#ffeb3b" : color} 
        opacity={hovered || selected ? 0.9 : 1} 
        transparent={hovered || selected}
        emissive={selected ? "#ffeb3b" : "#000000"}
        emissiveIntensity={selected ? 0.5 : 0}
      />
      <Edges color={selected ? "white" : "black"} threshold={15} />
      {hovered && (
        <Html distanceFactor={10} position={[0, dimensions[1] / 2 + 2, 0]}>
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground shadow-lg">
            <div className="font-semibold">Package #{packageId}</div>
            <div className="text-muted-foreground">
              {dimensions[0]}×{dimensions[1]}×{dimensions[2]}
            </div>
          </div>
        </Html>
      )}
    </mesh>
  )
}
