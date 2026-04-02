"""
Defines the Vehicle class.
"""

from .free_space import FreeSpace
from .item import PlacedItem


class Vehicle:
    """
    Represents a vehicle (bin) for packing items.

    Attributes:
        id: Unique identifier for the vehicle.
        L: Length of the vehicle.
        W: Width of the vehicle.
        H: Height of the vehicle.
        placements: List of items placed in this vehicle.
        free_spaces: List of free spaces available in the vehicle (for Free Space algorithm).
    """

    def __init__(self, vid: int, L: int, W: int, H: int):
        """
        Initializes a new Vehicle.

        Args:
            vid: Vehicle ID.
            L: Length.
            W: Width.
            H: Height.
        """
        self.id = vid
        self.L = L
        self.W = W
        self.H = H
        self.placements: list[PlacedItem] = []
        self.free_spaces: list[FreeSpace] = [FreeSpace(0, 0, 0, L, W, H)]

    def volume_used(self) -> int:
        """Calculates the total volume of items placed in the vehicle."""
        return sum(
            p.orientation[0] * p.orientation[1] * p.orientation[2]
            for p in self.placements
        )

    def volume_total(self) -> int:
        """Calculates the total capacity of the vehicle."""
        return self.L * self.W * self.H
