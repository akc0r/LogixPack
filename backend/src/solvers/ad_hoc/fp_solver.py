import time

from src.domain.entities import FreeSpace, Item, PlacedItem, Solution, Vehicle
from .utils import PackingUtils

class FreeSpaceSolver:
    """
    Solves the 3D Bin Packing problem using the Free Space Splitting algorithm.

    Algorithm:
    - Maintains a list of "free spaces" (empty cuboids) in each vehicle.
    - When an item is placed in a free space, the remaining space is split into new smaller free spaces.
    - Uses a Best-Fit strategy to choose the best free space for each item.
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

    def __calculate_placement_score(
        self, item: Item, fs: FreeSpace, orientation: tuple[int, int, int]
    ) -> float:
        """
        Calculates a score for placing an item in a specific free space with a specific orientation.
        Lower score is better.

        Score = Residual Volume (Best Fit)
        Bonus for items with delivery order to place them deeper/lower.
        """
        length, width, height = orientation
        residual_volume = fs.volume() - (length * width * height)
        score = residual_volume

        if item.D != -1:
            # Heuristic: push delivery items to the back (x=0) and bottom (z=0)
            # Note: This contradicts the delivery constraint logic where earlier items (smaller D)
            # should be at the front (larger x).
            # However, if we sort items by D descending, we place later items first (at the back).
            score -= fs.z0 * 100
            score -= fs.x0 * 50

        return score

    def __try_place_item(self, item: Item, vehicle: Vehicle) -> bool:
        """
        Tries to place an item in the best available free space in the vehicle.
        """
        orientations = PackingUtils.get_valid_orientations(item, self.L, self.W, self.H)

        best_placement = None
        best_score = float("inf")
        best_fs_idx = -1

        for fs_idx, fs in enumerate(vehicle.free_spaces):
            for orientation in orientations:
                length, width, height = orientation
                if fs.fits(length, width, height):
                    placed = PlacedItem(
                        item,
                        fs.x0,
                        fs.y0,
                        fs.z0,
                        fs.x0 + length,
                        fs.y0 + width,
                        fs.z0 + height,
                        orientation,
                        vehicle.id,
                    )

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
                        score = self.__calculate_placement_score(item, fs, orientation)
                        if score < best_score:
                            best_score = score
                            best_placement = placed
                            best_fs_idx = fs_idx

        if best_placement:
            vehicle.placements.append(best_placement)
            old_fs = vehicle.free_spaces[best_fs_idx]
            vehicle.free_spaces.pop(best_fs_idx)
            new_spaces = PackingUtils.split_free_space(old_fs, best_placement)
            vehicle.free_spaces.extend(new_spaces)
            return True

        return False

    def __sort_items(self) -> list[Item]:
        """
        Sorts items for the constructive phase.
        Primary key: Delivery order (descending). Items with no order (D=-1) are treated as D=0.
        Secondary key: Volume (descending).
        """
        return sorted(self.items, key=lambda x: (0 if x.D == -1 else -x.D, -x.volume))

    def __constructive_pack(self, randomize: bool = False) -> list[Vehicle]:
        """
        Constructs the solution by packing items one by one.
        """
        sorted_items = self.__sort_items()
        vehicles = []
        current_vehicle = Vehicle(0, self.L, self.W, self.H)
        vehicles.append(current_vehicle)

        for idx, item in enumerate(sorted_items):
            if not self.__try_place_item(item, current_vehicle):
                # If it doesn't fit in the current vehicle, start a new one.
                # Note: This is a Next-Fit strategy. Could be improved to First-Fit or Best-Fit among all vehicles.
                current_vehicle = Vehicle(len(vehicles), self.L, self.W, self.H)
                vehicles.append(current_vehicle)
                if not self.__try_place_item(item, current_vehicle):
                    print(f"Error: unable to place item {item.id}")

        return vehicles

    def __try_relocate(
        self, item_id: int, from_vehicle: Vehicle, to_vehicle: Vehicle
    ) -> bool:
        """
        Tries to relocate an item from one vehicle to another during local search.
        """
        placement_idx = None
        for idx, p in enumerate(from_vehicle.placements):
            if p.id == item_id:
                placement_idx = idx
                break

        if placement_idx is None:
            return False

        old_placement = from_vehicle.placements.pop(placement_idx)
        item = self.items[item_id]

        if self.__try_place_item(item, to_vehicle):
            # Rebuild from_vehicle to fix free spaces (since we removed an item)
            # This is expensive but necessary for Free Space algorithm consistency
            remaining_items = [self.items[p.id] for p in from_vehicle.placements]
            # Sort to ensure consistent packing
            remaining_items.sort(key=lambda x: (0 if x.D == -1 else -x.D, -x.volume))

            from_vehicle.placements = []
            from_vehicle.free_spaces = [FreeSpace(0, 0, 0, self.L, self.W, self.H)]

            for it in remaining_items:
                if not self.__try_place_item(it, from_vehicle):
                    # Should not happen as we have more space
                    print(
                        f"Warning: Failed to repack item {it.id} in vehicle {from_vehicle.id} during local search"
                    )

            return True
        else:
            # Revert if placement failed
            from_vehicle.placements.insert(placement_idx, old_placement)
            return False

    def __local_search(self):
        """
        Performs local search to reduce the number of vehicles.
        Tries to empty the last vehicles by moving their items to earlier vehicles.
        """
        improved = True
        iteration = 0
        max_iterations = 100

        while improved and iteration < max_iterations:
            improved = False
            iteration += 1

            for v_idx in range(len(self.vehicles) - 1, 0, -1):
                vehicle = self.vehicles[v_idx]
                items_to_move = [p.id for p in vehicle.placements]

                # Try to move largest items first
                for item_id in sorted(
                    items_to_move, key=lambda x: -self.items[x].volume
                ):
                    for target_idx in range(v_idx):
                        if self.__try_relocate(
                            item_id, vehicle, self.vehicles[target_idx]
                        ):
                            improved = True
                            break

                    if improved:
                        break

                if not vehicle.placements:
                    self.vehicles.pop(v_idx)
                    improved = True

                if improved:
                    break

    def solve(self) -> Solution:
        """
        Executes the solver.
        """
        start_time = time.time()

        if not PackingUtils.check_feasibility(self.items, self.L, self.W, self.H):
            return Solution("UNSAT", [], 0, time.time() - start_time)

        self.vehicles = self.__constructive_pack()

        self.__local_search()

        all_boxes = []
        for i, v in enumerate(self.vehicles):
            v.id = i
            for box in v.placements:
                box.vehicle_id = i
                all_boxes.append(box)

        return Solution("SAT", all_boxes, len(self.vehicles), time.time() - start_time)
