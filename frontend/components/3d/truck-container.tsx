"use client"

import { Html } from "@react-three/drei"
import * as THREE from "three"

interface TruckContainerProps {
  dimensions: [number, number, number]
}

export function TruckContainer({ dimensions }: TruckContainerProps) {
  const [width, height, depth] = dimensions
  const wallThickness = 1
  const wallColor = "#222222"

  return (
    <group>
      {/* Bottom Wall (Floor) */}
      <mesh position={[width / 2, -wallThickness / 2, depth / 2]}>
        <boxGeometry args={[width, wallThickness, depth]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Back Wall (at Z=0) */}
      <mesh position={[width / 2, height / 2, -wallThickness / 2]}>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Side Wall (at X=0) */}
      <mesh position={[-wallThickness / 2, height / 2, depth / 2]}>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Bounding Box Edges */}
      <lineSegments position={[width / 2, height / 2, depth / 2]}>
        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial attach="material" color="#666666" linewidth={1} />
      </lineSegments>

      {/* Dimensions Labels */}
      <Html position={[width / 2, -5, depth + 5]} center>
        <div className="text-xs font-bold text-foreground whitespace-nowrap bg-background/80 px-2 py-1 rounded border shadow-sm">
          L: {width}
        </div>
      </Html>
      
      <Html position={[-5, height / 2, depth + 5]} center>
        <div className="text-xs font-bold text-foreground whitespace-nowrap bg-background/80 px-2 py-1 rounded border shadow-sm">
          H: {height}
        </div>
      </Html>

      <Html position={[-5, -5, depth / 2]} center>
        <div className="text-xs font-bold text-foreground whitespace-nowrap bg-background/80 px-2 py-1 rounded border shadow-sm">
          W: {depth}
        </div>
      </Html>
    </group>
  )
}
