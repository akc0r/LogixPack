// Core data types for the 3D Bin Packing application

export interface TruckDimensions {
  width: number
  height: number
  depth: number
}

export interface Package {
  id: number
  width: number
  height: number
  depth: number
  deliveryOrder: number // -1 means no specific order
}

export interface PackagePosition extends Package {
  truckId: number
  minPoint: [number, number, number] // Closest point to origin
  maxPoint: [number, number, number] // Furthest point from origin
}

export interface TestFile {
  id: string
  name: string
  truckDimensions: TruckDimensions
  packages?: Package[]
  uploadedAt: Date
  isBackend?: boolean
  numItems?: number
}

export interface AlgorithmResult {
  status: "SAT" | "UNSAT"
  placements: PackagePosition[]
  trucksUsed: number
  executionTime?: number
}

export interface TruckData {
  id: number
  dimensions: TruckDimensions
  packages: PackagePosition[]
  fillPercentage: number
  totalVolume: number
  usedVolume: number
}

export type AlgorithmType = "adhoc1" | "adhoc2" | "cp"

export interface AlgorithmOption {
  id: AlgorithmType
  name: string
  description: string
}
