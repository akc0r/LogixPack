import type { TruckDimensions, Package, TestFile, AlgorithmResult, PackagePosition } from "./types"

/**
 * Parses the input file format for bin packing problems
 * Format:
 * Line 1: truck dimensions (Length Width Height)
 * Line 2: number of packages
 * Lines 3+: package dimensions and delivery order (Length Width Height Order)
 */
export function parseInputFile(content: string, fileName: string): TestFile {
  const lines = content
    .trim()
    .split("\n")
    .filter((line) => line.trim().length > 0)

  if (lines.length < 2) {
    throw new Error("Invalid file format: insufficient lines")
  }

  // Parse truck dimensions
  const truckDims = lines[0].trim().split(/\s+/).map(Number)
  if (truckDims.length !== 3 || truckDims.some(isNaN)) {
    throw new Error("Invalid truck dimensions format")
  }

  const truckDimensions: TruckDimensions = {
    width: truckDims[0],
    height: truckDims[2],
    depth: truckDims[1],
  }

  // Parse number of packages
  const numPackages = Number.parseInt(lines[1].trim())
  if (isNaN(numPackages) || numPackages < 0) {
    throw new Error("Invalid number of packages")
  }

  // Parse packages
  const packages: Package[] = []
  for (let i = 0; i < numPackages; i++) {
    const lineIndex = i + 2
    if (lineIndex >= lines.length) {
      throw new Error(`Missing package data for package ${i}`)
    }

    const packageData = lines[lineIndex].trim().split(/\s+/).map(Number)
    if (packageData.length !== 4 || packageData.some(isNaN)) {
      throw new Error(`Invalid package format at line ${lineIndex + 1}`)
    }

    packages.push({
      id: i,
      width: packageData[0],
      height: packageData[2],
      depth: packageData[1],
      deliveryOrder: packageData[3],
    })
  }

  return {
    id: crypto.randomUUID(),
    name: fileName,
    truckDimensions,
    packages,
    uploadedAt: new Date(),
  }
}

/**
 * Parses the algorithm output format
 * Format:
 * Line 1: SAT or UNSAT
 * Lines 2+: package_id minX minY minZ maxX maxY maxZ
 */
export function parseAlgorithmOutput(content: string): AlgorithmResult {
  const lines = content
    .trim()
    .split("\n")
    .filter((line) => line.trim().length > 0)

  if (lines.length < 1) {
    throw new Error("Invalid output format: empty content")
  }

  const status = lines[0].trim().toUpperCase()
  if (status !== "SAT" && status !== "UNSAT") {
    throw new Error("Invalid status: must be SAT or UNSAT")
  }

  if (status === "UNSAT") {
    return {
      status: "UNSAT",
      placements: [],
      trucksUsed: 0,
    }
  }

  // Parse placements
  const placements: PackagePosition[] = []
  const truckMap = new Map<number, number>() // Map to track which truck each package is in

  for (let i = 1; i < lines.length; i++) {
    const data = lines[i].trim().split(/\s+/).map(Number)
    if (data.length !== 7 || data.some(isNaN)) {
      throw new Error(`Invalid placement format at line ${i + 1}`)
    }

    const [packageId, minX, minY, minZ, maxX, maxY, maxZ] = data

    // Simple truck assignment based on Y coordinate (vertical stacking)
    // In a real scenario, this would come from the algorithm
    const truckId = Math.floor(minY / 100) // Adjust based on your truck height

    placements.push({
      id: packageId,
      truckId,
      width: maxX - minX,
      height: maxY - minY,
      depth: maxZ - minZ,
      deliveryOrder: -1, // Will be filled from original data
      minPoint: [minX, minY, minZ],
      maxPoint: [maxX, maxY, maxZ],
    })

    truckMap.set(packageId, truckId)
  }

  const trucksUsed = new Set(placements.map((p) => p.truckId)).size

  return {
    status: "SAT",
    placements,
    trucksUsed,
  }
}

/**
 * Validates a test file for common issues
 */
export function validateTestFile(file: TestFile): string[] {
  const errors: string[] = []

  // Check truck dimensions
  if (file.truckDimensions.width <= 0 || file.truckDimensions.height <= 0 || file.truckDimensions.depth <= 0) {
    errors.push("Truck dimensions must be positive")
  }

  // Check packages
  file.packages.forEach((pkg, index) => {
    if (pkg.width <= 0 || pkg.height <= 0 || pkg.depth <= 0) {
      errors.push(`Package ${index} has invalid dimensions`)
    }
    if (
      pkg.width > file.truckDimensions.width ||
      pkg.height > file.truckDimensions.height ||
      pkg.depth > file.truckDimensions.depth
    ) {
      errors.push(`Package ${index} is larger than truck in at least one dimension`)
    }
  })

  return errors
}

/**
 * Formats file content for download
 */
export function formatInputFile(file: TestFile): string {
  let content = ""

  // Truck dimensions
  content += `${file.truckDimensions.width} ${file.truckDimensions.height} ${file.truckDimensions.depth}\n`

  // Number of packages
  content += `${file.packages.length}\n`

  // Packages
  file.packages.forEach((pkg) => {
    content += `${pkg.width} ${pkg.height} ${pkg.depth} ${pkg.deliveryOrder}\n`
  })

  return content
}
