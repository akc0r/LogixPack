from src.domain.entities import FreeSpace, Item, PlacedItem, Vehicle

class PackingUtils:
    """
    Static utility class for packing operations.
    """

    @staticmethod
    def get_valid_orientations(
        item: Item, L: int, W: int, H: int
    ) -> list[tuple[int, int, int]]:
        """
        Returns all valid orientations for an item that fit within the vehicle dimensions.

        Args:
            item: The item to check.
            L: Vehicle length.
            W: Vehicle width.
            H: Vehicle height.

        Returns:
            A list of tuples (length, width, height) representing valid orientations.
        """
        orientations = [
            (item.length, item.width, item.height),
            (item.length, item.height, item.width),
            (item.width, item.length, item.height),
            (item.width, item.height, item.length),
            (item.height, item.length, item.width),
            (item.height, item.width, item.length),
        ]
        valid = []
        seen = set()
        for o in orientations:
            if o not in seen and o[0] <= L and o[1] <= W and o[2] <= H:
                valid.append(o)
                seen.add(o)
        return valid

    @staticmethod
    def check_feasibility(items: list[Item], L: int, W: int, H: int) -> bool:
        """
        Checks if all items have at least one valid orientation within the vehicle dimensions.

        Args:
            items: List of items.
            L: Vehicle length.
            W: Vehicle width.
            H: Vehicle height.

        Returns:
            True if all items can fit individually, False otherwise.
        """
        for item in items:
            if not PackingUtils.get_valid_orientations(item, L, W, H):
                return False
        return True

    @staticmethod
    def split_free_space(fs: FreeSpace, placed: PlacedItem) -> list[FreeSpace]:
        """
        Splits a free space into smaller free spaces after placing an item.
        Used in the Free Space Splitting algorithm.

        Args:
            fs: The original free space.
            placed: The item placed within the free space.

        Returns:
            A list of new FreeSpace objects.
        """
        new_spaces = []

        if placed.x1 < fs.x1:
            new_spaces.append(FreeSpace(placed.x1, fs.y0, fs.z0, fs.x1, fs.y1, fs.z1))

        if placed.y1 < fs.y1:
            new_spaces.append(
                FreeSpace(fs.x0, placed.y1, fs.z0, placed.x1, fs.y1, fs.z1)
            )

        if placed.z1 < fs.z1:
            new_spaces.append(
                FreeSpace(fs.x0, fs.y0, placed.z1, placed.x1, placed.y1, fs.z1)
            )

        return [s for s in new_spaces if s.volume() > 0]

    @staticmethod
    def overlaps(placed1: PlacedItem, placed2: PlacedItem) -> bool:
        """
        Checks if two placed items overlap in 3D space.

        Args:
            placed1: First placed item.
            placed2: Second placed item.

        Returns:
            True if they overlap, False otherwise.
        """
        return not (
            placed1.x1 <= placed2.x0
            or placed2.x1 <= placed1.x0
            or placed1.y1 <= placed2.y0
            or placed2.y1 <= placed1.y0
            or placed1.z1 <= placed2.z0
            or placed2.z1 <= placed1.z0
        )

    @staticmethod
    def check_delivery_constraint(
        vehicle: Vehicle, new_placed: PlacedItem, item: Item, items: list[Item]
    ) -> bool:
        """
        Checks if placing a new item respects the delivery order constraints relative to
        items already placed in the vehicle.

        Constraint: If item A must be delivered before item B (D_A < D_B), then A must be
        accessible when B is in the truck. This means A is closer to the door (larger x)
        or above B (larger z).

        Args:
            vehicle: The vehicle containing existing placements.
            new_placed: The proposed placement for the new item.
            item: The new item being placed.
            items: The full list of items (to look up delivery orders).

        Returns:
            True if the constraint is respected, False otherwise.
        """
        if item.D == -1:
            return True

        for placement in vehicle.placements:
            other_item = items[placement.id]
            if other_item.D == -1:
                continue

            if item.D < other_item.D:
                # item delivered EARLIER than other_item.
                # item should be closer to door (larger x) or accessible.

                # Check if placement blocks new_placed in X (placement is in front)
                if placement.x0 >= new_placed.x0:
                    # Check YZ overlap
                    if not (
                        placement.y1 <= new_placed.y0
                        or new_placed.y1 <= placement.y0
                        or placement.z1 <= new_placed.z0
                        or new_placed.z1 <= placement.z0
                    ):
                        return False

                # Check if placement blocks new_placed in Z (placement is above)
                if placement.z0 >= new_placed.z0:
                    # Check XY overlap
                    if not (
                        placement.x1 <= new_placed.x0
                        or new_placed.x1 <= placement.x0
                        or placement.y1 <= new_placed.y0
                        or new_placed.y1 <= placement.y0
                    ):
                        return False

            elif other_item.D < item.D:
                # item delivered LATER than other_item.
                # other_item should be closer to door.

                # Check if new_placed blocks placement in X
                if new_placed.x0 >= placement.x0:
                    # Check YZ overlap
                    if not (
                        new_placed.y1 <= placement.y0
                        or placement.y1 <= new_placed.y0
                        or new_placed.z1 <= placement.z0
                        or placement.z1 <= new_placed.z0
                    ):
                        return False

                # Check if new_placed blocks placement in Z
                if new_placed.z0 >= placement.z0:
                    # Check XY overlap
                    if not (
                        new_placed.x1 <= placement.x0
                        or placement.x1 <= new_placed.x0
                        or new_placed.y1 <= placement.y0
                        or placement.y1 <= new_placed.y0
                    ):
                        return False

        return True

    @staticmethod
    def print_solution(vehicles: list[Vehicle], items: list[Item]):
        """
        Prints a summary of the solution to stdout.
        """
        for v in vehicles:
            print(f"\n      Vehicle {v.id}:")
            print(
                f"        Volume: {v.volume_used()}/{v.volume_total()} "
                + f"({100 * v.volume_used() / v.volume_total():.1f}%)"
            )
            print(f"        Items: {len(v.placements)}")

    @staticmethod
    def find_best_position_for_item(
        item: Item, vehicle: Vehicle, items: list[Item], L: int, W: int, H: int
    ) -> PlacedItem | None:
        """
        Finds a valid position and orientation for an item in a vehicle using corner points strategy.
        Tries to place the item at (0,0,0) or adjacent to existing items.

        Args:
            item: The item to place.
            vehicle: The target vehicle.
            items: Full list of items.
            L, W, H: Vehicle dimensions.

        Returns:
            A PlacedItem object if a valid position is found, None otherwise.
        """
        # Strategy: try corners and positions along existing items
        candidate_positions = [(0, 0, 0)]

        for box in vehicle.placements:
            # Positions to the right, front, top
            candidate_positions.extend(
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

        # Sort by (z, y, x) to favor low positions
        candidate_positions.sort(key=lambda p: (p[2], p[1], p[0]))

        # Try all valid orientations
        orientations = PackingUtils.get_valid_orientations(item, L, W, H)

        for x, y, z in candidate_positions:
            for orientation in orientations:
                l, w, h = orientation

                # Check vehicle bounds
                if x + l > L or y + w > W or z + h > H:
                    continue

                new_box = PlacedItem(
                    item, x, y, z, x + l, y + w, z + h, orientation, vehicle.id
                )

                # Check overlaps
                if any(PackingUtils.overlaps(new_box, b) for b in vehicle.placements):
                    continue

                # Check delivery constraints
                if not PackingUtils.check_delivery_constraint(
                    vehicle, new_box, item, items
                ):
                    continue

                return new_box

        return None
