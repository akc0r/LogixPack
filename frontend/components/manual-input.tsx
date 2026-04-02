"use client"

import { useState } from "react"
import { Plus, Minus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFileStore } from "@/hooks/use-file-store"
import { uploadInstance } from "@/lib/api"
import type { TruckDimensions, Package, TestFile } from "@/lib/types"

export function ManualInput() {
  const [truckDims, setTruckDims] = useState<TruckDimensions>({
    width: 40,
    height: 40,
    depth: 20,
  })

  const [packages, setPackages] = useState<Omit<Package, "id">[]>([
    { width: 40, height: 20, depth: 10, deliveryOrder: -1 },
  ])
  
  const [isUploading, setIsUploading] = useState(false)

  const addFile = useFileStore((state) => state.addFile)

  const addPackage = () => {
    setPackages([...packages, { width: 10, height: 10, depth: 10, deliveryOrder: -1 }])
  }

  const removePackage = (index: number) => {
    setPackages(packages.filter((_, i) => i !== index))
  }

  const updatePackage = (index: number, field: keyof Omit<Package, "id">, value: number) => {
    const updated = [...packages]
    updated[index] = { ...updated[index], [field]: value }
    setPackages(updated)
  }

  const handleSubmit = async () => {
    setIsUploading(true)
    try {
      // Construct file content
      const lines = []
      // Format: Length Width Height
      lines.push(`${truckDims.width} ${truckDims.depth} ${truckDims.height}`)
      lines.push(`${packages.length}`)
      packages.forEach(pkg => {
        // Format: Length Width Height Order
        lines.push(`${pkg.width} ${pkg.depth} ${pkg.height} ${pkg.deliveryOrder}`)
      })
      const content = lines.join("\n")
      
      const filename = `manual_${new Date().getTime()}.txt`
      const file = new File([content], filename, { type: "text/plain" })
      
      // Upload to backend (MinIO)
      await uploadInstance(file)
      
      const testFile: TestFile = {
        id: filename, // Use filename as ID to match backend
        name: filename,
        truckDimensions: truckDims,
        packages: packages.map((pkg, index) => ({ ...pkg, id: index })),
        uploadedAt: new Date(),
        isBackend: true
      }

      addFile(testFile)

      // Reset form
      setPackages([{ width: 40, height: 20, depth: 10, deliveryOrder: -1 }])
    } catch (error) {
      console.error("Failed to upload manual input", error)
      // Handle error (maybe show toast)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Manual Input</h3>

      <div className="space-y-6">
        {/* Truck Dimensions */}
        <div>
          <Label className="mb-3 block text-sm font-medium">Truck Dimensions</Label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="truck-length" className="text-xs text-muted-foreground">
                Length
              </Label>
              <Input
                id="truck-length"
                type="number"
                min="1"
                value={truckDims.width}
                onChange={(e) => setTruckDims({ ...truckDims, width: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="truck-width" className="text-xs text-muted-foreground">
                Width
              </Label>
              <Input
                id="truck-width"
                type="number"
                min="1"
                value={truckDims.depth}
                onChange={(e) => setTruckDims({ ...truckDims, depth: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="truck-height" className="text-xs text-muted-foreground">
                Height
              </Label>
              <Input
                id="truck-height"
                type="number"
                min="1"
                value={truckDims.height}
                onChange={(e) => setTruckDims({ ...truckDims, height: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Packages */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label className="text-sm font-medium">Packages ({packages.length})</Label>
            <Button onClick={addPackage} size="sm" variant="outline">
              <Plus className="mr-1 h-3 w-3" />
              Add Package
            </Button>
          </div>

          <div className="max-h-[400px] space-y-3 overflow-y-auto">
            {packages.map((pkg, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>

                  <div className="grid flex-1 grid-cols-4 gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={pkg.width}
                      onChange={(e) => updatePackage(index, "width", Number(e.target.value))}
                      placeholder="L"
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      min="1"
                      value={pkg.depth}
                      onChange={(e) => updatePackage(index, "depth", Number(e.target.value))}
                      placeholder="W"
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      min="1"
                      value={pkg.height}
                      onChange={(e) => updatePackage(index, "height", Number(e.target.value))}
                      placeholder="H"
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      value={pkg.deliveryOrder}
                      onChange={(e) => updatePackage(index, "deliveryOrder", Number(e.target.value))}
                      placeholder="Order"
                      className="h-8 text-xs"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePackage(index)}
                    disabled={packages.length === 1}
                    className="h-8 w-8"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full" disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Add to Test Suite"
          )}
        </Button>
      </div>
    </Card>
  )
}
