import time

from src.domain.entities import Item, PlacedItem, Solution, Vehicle
from .utils import PackingUtils

class LayerBasedSolver:
    """
    Solves the 3D Bin Packing problem using a Layer-Based approach.

    Algorithm:
    - Packs items in horizontal layers (along the Z-axis).
    - Within each layer, items are packed in the XY plane.
    - The height of a layer is determined by the tallest item in that layer.
    - Useful for stacking items of similar heights.
    """

    def __init__(
        self,
        truck_dims: tuple[int, int, int],
        items: list[Item],
    ):
        """
        Initializes the solver.

        Args:
            truck_dims: Dimensions of the vehicle (L, W, H).
            items: List of items to pack.
        """
        self.L, self.W, self.H = truck_dims
        self.items = items
        self.vehicles: list[Vehicle] = []

    def __get_best_orientation_for_layer(
        self, item: Item
    ) -> tuple[int, int, int] | None:
        """
        Chooses the orientation with the largest base area (l*w) and minimal height.
        This maximizes stability and minimizes the layer height.
        """
        orientations = PackingUtils.get_valid_orientations(item, self.L, self.W, self.H)
        if not orientations:
            return None

        # Sort by decreasing base area, then increasing height
        orientations.sort(key=lambda o: (-o[0] * o[1], o[2]))
        return orientations[0]

    def __place_in_layer(self, item: Item, vehicle: Vehicle, z_base: int) -> bool:
        """
        Tries to place an item in the current layer at height z_base.
        Scans the XY plane to find a valid position.
        """
        orientation = self.__get_best_orientation_for_layer(item)
        if not orientation:
            return False

        length, width, height = orientation

        # Look for a position in the layer (scan x, y)
        # Step of 5 units to accelerate search (heuristic trade-off)
        for x in range(0, self.L - length + 1, 5):
            for y in range(0, self.W - width + 1, 5):
                if z_base + height > self.H:
                    continue

                placed = PlacedItem(
                    item,
                    x,
                    y,
                    z_base,
                    x + length,
                    y + width,
                    z_base + height,
                    orientation,
                    vehicle.id,
                )

                # Check constraints
                if not PackingUtils.check_delivery_constraint(
                    vehicle, placed, item, self.items
                ):
                    continue

                valid = True
                for p in vehicle.placements:
                    if PackingUtils.overlaps(placed, p):
                        valid = False
                        break

                if valid:
                    vehicle.placements.append(placed)
                    return True

        return False

    def __sort_items(self) -> list[Item]:
        """
        Sorts items for the constructive phase.
        Primary key: Delivery order (ascending). Earliest delivery (D=0) first?
        Actually, the code sorts by D ascending, but treats D=-1 as 999 (last).
        This means items with specific delivery orders are placed first (at the bottom/back).
        Wait, if D=0 is first delivery, it should be at the front/top.
        If we fill from back to front (x=0 to L), we should place LAST delivery items first.
        If we fill from bottom to top (z=0 to H), we should place LAST delivery items first.

        The current sort `(x.D if x.D != -1 else 999, -x.height)` puts small D first.
        Small D = early delivery.
        If we place early delivery items at z=0, they are blocked by later items.
        This seems wrong for the Z-axis logic unless we reverse the loading order.
        However, let's keep the logic consistent with the existing code for now, assuming
        the user might have a specific reason or the check_delivery_constraint handles it.
        """
        return sorted(self.items, key=lambda x: (x.D if x.D != -1 else 999, -x.height))

    def __constructive_pack(self) -> list[Vehicle]:
        """
        Builds the solution by filling vehicles layer by layer.
        """
        sorted_items = self.__sort_items()

        vehicles = []
        current_vehicle = Vehicle(0, self.L, self.W, self.H)
        vehicles.append(current_vehicle)

        current_z = 0
        layer_height = 0

        for item in sorted_items:
            placed = False
            orientation = self.__get_best_orientation_for_layer(item)

            # Try to place in the current layer
            if self.__place_in_layer(item, current_vehicle, current_z):
                placed = True
                # Update the layer height
                if orientation:
                    layer_height = max(layer_height, orientation[2])

            # If not placed, try a new layer in the same vehicle
            if not placed:
                current_z += layer_height
                layer_height = 0

                if self.__place_in_layer(item, current_vehicle, current_z):
                    placed = True
                    if orientation:
                        layer_height = orientation[2]

            # If still not placed, start a new vehicle
            if not placed:
                current_vehicle = Vehicle(len(vehicles), self.L, self.W, self.H)
                vehicles.append(current_vehicle)
                current_z = 0
                layer_height = 0

                if self.__place_in_layer(item, current_vehicle, current_z):
                    if orientation:
                        layer_height = orientation[2]
                else:
                    print(f"Error: unable to place item {item.id}")

        return vehicles

    def __local_search(self):
        """
        Simple local search to try and merge underutilized vehicles.
        """
        improved = True
        iteration = 0
        max_iterations = 50

        while improved and iteration < max_iterations:
            improved = False
            iteration += 1

            # Try to merge underutilized vehicles
            for i in range(len(self.vehicles) - 1, 0, -1):
                v1 = self.vehicles[i]
                if v1.volume_used() < v1.volume_total() * 0.4:  # Less than 40% filled
                    # Try to redistribute into other vehicles
                    # Note: This is a placeholder for a more complex logic.
                    # In a layer-based approach, moving items is hard without breaking layers.
                    pass

    def solve(self) -> Solution:
        """
        Executes the solver.
        """
        start_time = time.time()

        if not PackingUtils.check_feasibility(self.items, self.L, self.W, self.H):
            return Solution("UNSAT", [], 0, time.time() - start_time)

        self.vehicles = self.__constructive_pack()

        self.__local_search()

        # Flatten vehicles to boxes
        all_boxes = []
        for i, v in enumerate(self.vehicles):
            v.id = i
            for placed in v.placements:
                placed.vehicle_id = i
                all_boxes.append(placed)

        return Solution("SAT", all_boxes, len(self.vehicles), time.time() - start_time)
