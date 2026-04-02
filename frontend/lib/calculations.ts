import type { TruckDimensions, TruckData, PackagePosition, TestFile } from "./types"

/**
 * Calculate statistics for a test file
 */
export function calculateFileStatistics(file: TestFile) {
  const truckVolume = file.truckDimensions.width * file.truckDimensions.height * file.truckDimensions.depth

  if (!file.packages) {
    return {
      truckVolume,
      totalPackageVolume: 0,
      minTrucksTheoretical: 0,
      totalPackages: file.numItems || 0,
      packagesWithDeliveryOrder: 0,
      averagePackageVolume: 0,
    }
  }

  const totalPackageVolume = file.packages.reduce((sum, pkg) => {
    return sum + pkg.width * pkg.height * pkg.depth
  }, 0)

  const minTrucksTheoretical = Math.ceil(totalPackageVolume / truckVolume)

  const packagesWithOrder = file.packages.filter((p) => p.deliveryOrder !== -1).length

  return {
    truckVolume,
    totalPackageVolume,
    minTrucksTheoretical,
    totalPackages: file.packages.length,
    packagesWithDeliveryOrder: packagesWithOrder,
    averagePackageVolume: totalPackageVolume / file.packages.length,
  }
}

/**
 * Organize placements into truck data structures
 */
export function organizeTruckData(placements: PackagePosition[], truckDimensions: TruckDimensions): TruckData[] {
  const truckMap = new Map<number, PackagePosition[]>()

  // Group packages by truck
  placements.forEach((placement) => {
    if (!truckMap.has(placement.truckId)) {
      truckMap.set(placement.truckId, [])
    }
    truckMap.get(placement.truckId)!.push(placement)
  })

  const truckVolume = truckDimensions.width * truckDimensions.height * truckDimensions.depth

  // Create truck data
  const trucks: TruckData[] = []
  truckMap.forEach((packages, truckId) => {
    const usedVolume = packages.reduce((sum, pkg) => {
      return sum + pkg.width * pkg.height * pkg.depth
    }, 0)

    trucks.push({
      id: truckId,
      dimensions: truckDimensions,
      packages,
      totalVolume: truckVolume,
      usedVolume,
      fillPercentage: (usedVolume / truckVolume) * 100,
    })
  })

  return trucks.sort((a, b) => a.id - b.id)
}

/**
 * Calculate color for a package based on its ID
 */
export function getPackageColor(packageId: number): string {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
    "#06b6d4", // cyan
    "#6366f1", // indigo
  ]
  return colors[packageId % colors.length]
}
