import sys
import time

from src.domain.entities import PlacedItem, Item, Vehicle, Solution
from .utils import PackingUtils

class FirstFitDecreasingSolver:
    """
    Solves the 3D Bin Packing problem using a constructive heuristic followed by local search.

    Algorithm:
    1. Construction: First Fit Decreasing (FFD)
       - Sort items by volume (decreasing).
       - Place each item in the first vehicle where it fits.
       - If it doesn't fit in any existing vehicle, open a new one.
    2. Improvement: Local Search (Descent)
       - Try to empty the least filled vehicle by moving its items to other vehicles.
    """

    def __init__(
        self,
        truck_dims: tuple[int, int, int],
        items: list[Item],
        enable_improvements: bool = False,
        time_limit: int = 300,
    ):
        """
        Initializes the solver.

        Args:
            truck_dims: Dimensions of the vehicle (L, W, H).
            items: List of items to pack.
            enable_improvements: Whether to run local search after construction.
            time_limit: Maximum time allowed for the solver (in seconds).
        """
        self.L, self.W, self.H = truck_dims
        self.items = items
        self.vehicles: list[Vehicle] = []
        self.enable_improvements = enable_improvements

        self.n_items = len(items)
        self.time_limit = time_limit

        # Estimate max vehicles (Lower Bound)
        total_volume = sum(item.volume for item in items)
        vehicle_vol = self.L * self.W * self.H
        self.max_vehicles = min(
            self.n_items, (total_volume + vehicle_vol - 1) // vehicle_vol + 1
        )

        self.best_solution: list[PlacedItem] | None = None
        self.best_num_vehicles = float("inf")

    def _rebuild_candidates(self, vehicle: Vehicle):
        """
        Rebuilds candidate points for a vehicle from scratch.
        Useful after removing items during local search.
        """
        candidates = [(0, 0, 0)]
        for box in vehicle.placements:
            candidates.extend(
                [
                    (box.x1, box.y0, box.z0),
                    (box.x0, box.y1, box.z0),
                    (box.x0, box.y0, box.z1),
                    (box.x1, box.y1, box.z0),
                    (box.x1, box.y0, box.z1),
                    (box.x0, box.y1, box.z1),
                    (box.x1, box.y1, box.z1),
                ]
            )

        # Filter valid candidates
        valid_candidates = []
        for p in candidates:
            px, py, pz = p
            if px >= self.L or py >= self.W or pz >= self.H:
                continue

            # Check if inside any existing box
            is_blocked = False
            for b in vehicle.placements:
                if (
                    b.x0 <= px < b.x1
                    and b.y0 <= py < b.y1
                    and b.z0 <= pz < b.z1
                ):
                    is_blocked = True
                    break
            if not is_blocked:
                valid_candidates.append(p)

        # Remove duplicates
        vehicle.candidate_points = list(set(valid_candidates))

    def _update_candidates(self, vehicle: Vehicle, new_box: PlacedItem):
        """
        Updates the list of candidate points for a vehicle after placing a new item.
        Removes points covered by the new item and adds new points around it.
        """
        if not hasattr(vehicle, "candidate_points"):
            vehicle.candidate_points = [(0, 0, 0)]

        # Filter out points inside the new box
        vehicle.candidate_points = [
            p
            for p in vehicle.candidate_points
            if not (
                new_box.x0 <= p[0] < new_box.x1
                and new_box.y0 <= p[1] < new_box.y1
                and new_box.z0 <= p[2] < new_box.z1
            )
        ]

        # Add new candidates
        new_candidates = [
            (new_box.x1, new_box.y0, new_box.z0),
            (new_box.x0, new_box.y1, new_box.z0),
            (new_box.x0, new_box.y0, new_box.z1),
            (new_box.x1, new_box.y1, new_box.z0),
            (new_box.x1, new_box.y0, new_box.z1),
            (new_box.x0, new_box.y1, new_box.z1),
            (new_box.x1, new_box.y1, new_box.z1),
        ]

        for p in new_candidates:
            px, py, pz = p
            if px >= self.L or py >= self.W or pz >= self.H:
                continue

            # Check if inside any existing box
            is_blocked = False
            for b in vehicle.placements:
                if (
                    b.x0 <= px < b.x1
                    and b.y0 <= py < b.y1
                    and b.z0 <= pz < b.z1
                ):
                    is_blocked = True
                    break

            if not is_blocked:
                vehicle.candidate_points.append(p)

    def _find_position_optimized(
        self, item: Item, vehicle: Vehicle
    ) -> PlacedItem | None:
        """
        Finds a valid position for an item in a vehicle using maintained candidate points.
        """
        if not hasattr(vehicle, "candidate_points"):
            vehicle.candidate_points = [(0, 0, 0)]

        # Sort candidates: z, y, x (favor bottom-left-back)
        vehicle.candidate_points.sort(key=lambda p: (p[2], p[1], p[0]))

        orientations = PackingUtils.get_valid_orientations(item, self.L, self.W, self.H)

        for x, y, z in vehicle.candidate_points:
            for orientation in orientations:
                l, w, h = orientation

                if x + l > self.L or y + w > self.W or z + h > self.H:
                    continue

                # Check overlaps (inline for speed)
                overlap = False
                for b in vehicle.placements:
                    if not (
                        x + l <= b.x0
                        or b.x1 <= x
                        or y + w <= b.y0
                        or b.y1 <= y
                        or z + h <= b.z0
                        or b.z1 <= z
                    ):
                        overlap = True
                        break
                if overlap:
                    continue

                new_box = PlacedItem(
                    item, x, y, z, x + l, y + w, z + h, orientation, vehicle.id
                )

                # Check delivery constraints
                if not PackingUtils.check_delivery_constraint(
                    vehicle, new_box, item, self.items
                ):
                    continue

                return new_box
        return None

    def __update_best_solution(self):
        """
        Updates best_solution from current vehicles.
        """
        all_boxes = []
        for v in self.vehicles:
            all_boxes.extend(v.placements)
        self.best_solution = all_boxes

    def __construct_ffd(self) -> list[Vehicle]:
        """
        Constructs an initial solution using First Fit Decreasing.
        """
        # Sort items by decreasing volume
        sorted_items = sorted(self.items, key=lambda x: x.volume, reverse=True)
        vehicles: list[Vehicle] = []

        for item in sorted_items:
            placed = False

            # Try to place in an existing vehicle
            for vehicle in vehicles:
                box = self._find_position_optimized(item, vehicle)
                if box:
                    vehicle.placements.append(box)
                    self._update_candidates(vehicle, box)
                    placed = True
                    break

            # If not placed, create a new vehicle
            if not placed:
                if len(vehicles) >= self.max_vehicles:
                    # Heuristic failure (too many vehicles), but we continue to try to fit all items
                    pass

                new_vehicle = Vehicle(len(vehicles), self.L, self.W, self.H)
                new_vehicle.candidate_points = [(0, 0, 0)]
                box = self._find_position_optimized(item, new_vehicle)

                if box:
                    new_vehicle.placements.append(box)
                    self._update_candidates(new_vehicle, box)
                    vehicles.append(new_vehicle)
                else:
                    # Item does not fit in an empty vehicle!
                    return []

        return vehicles

    def __local_search(self, start_time: float) -> bool:
        """
        Performs local search to improve the solution (reduce number of vehicles).
        """
        improved = False
        iteration = 0
        max_iterations = 100

        while iteration < max_iterations:
            if time.time() - start_time > self.time_limit * 0.9:
                break

            iteration += 1
            current_improved = self._try_move_to_other_vehicle()

            if current_improved:
                improved = True
                self.best_num_vehicles = len(self.vehicles)
                self.__update_best_solution()
            else:
                break

        return improved

    def _try_move_to_other_vehicle(self) -> bool:
        """
        Tries to move all items from the least filled vehicle to other vehicles.
        If successful, the vehicle is removed.
        """
        if len(self.vehicles) < 2:
            return False

        # Identify the least filled vehicle (by number of items)
        least_filled_idx = min(
            range(len(self.vehicles)), key=lambda i: len(self.vehicles[i].placements)
        )
        least_filled_vehicle = self.vehicles[least_filled_idx]

        # Try to move all items from this vehicle
        items_to_move = list(least_filled_vehicle.placements)  # Copy

        moved_any = False

        for box in items_to_move:
            item = self.items[box.id]
            moved = False

            for target_idx, target_vehicle in enumerate(self.vehicles):
                if target_idx == least_filled_idx:
                    continue

                new_box = self._find_position_optimized(item, target_vehicle)
                if new_box:
                    # Move successful
                    target_vehicle.placements.append(new_box)
                    self._update_candidates(target_vehicle, new_box)
                    least_filled_vehicle.placements.remove(box)
                    moved = True
                    moved_any = True
                    break

            if not moved:
                pass

        # Rebuild candidates for the source vehicle if it still exists
        if least_filled_vehicle.placements:
            self._rebuild_candidates(least_filled_vehicle)

        # Clean up empty vehicles
        self.vehicles = [v for v in self.vehicles if len(v.placements) > 0]
        # Re-index vehicles
        for i, v in enumerate(self.vehicles):
            v.id = i
            for box in v.placements:
                box.vehicle_id = i

        return moved_any

    def solve(self) -> Solution:
        """
        Executes the solver.
        """
        start_time = time.time()

        # Phase 1: Construction with FFD (First Fit Decreasing)
        self.vehicles = self.__construct_ffd()

        if not self.vehicles:
            return Solution("UNSAT", [], 0, time.time() - start_time)

        self.best_num_vehicles = len(self.vehicles)
        self.__update_best_solution()

        # Phase 2: Local Search (if enabled and time available)
        elapsed = time.time() - start_time
        if self.enable_improvements and elapsed < self.time_limit * 0.8:
            improved = self.__local_search(start_time)
            if improved:
                print(
                    f"  After local search: {self.best_num_vehicles} vehicles",
                    file=sys.stderr,
                )

        solve_time = time.time() - start_time

        return Solution("SAT", self.best_solution, self.best_num_vehicles, solve_time)
