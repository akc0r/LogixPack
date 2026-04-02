"""
Defines the FreeSpace class used in the Free Space Splitting algorithm.
"""

from dataclasses import dataclass


@dataclass
class FreeSpace:
    """
    Represents a rectangular cuboid of free space within a vehicle.

    Attributes:
        x0, y0, z0: Coordinates of the bottom-left-back corner.
        x1, y1, z1: Coordinates of the top-right-front corner.
    """

    x0: int
    y0: int
    z0: int
    x1: int
    y1: int
    z1: int

    def volume(self) -> int:
        """Calculates the volume of the free space."""
        return max(0, (self.x1 - self.x0) * (self.y1 - self.y0) * (self.z1 - self.z0))

    def fits(self, length: int, width: int, height: int) -> bool:
        """
        Checks if an item with given dimensions fits in this free space.

        Args:
            length: Length of the item.
            width: Width of the item.
            height: Height of the item.

        Returns:
            True if the item fits, False otherwise.
        """
        return (
            self.x1 - self.x0 >= length
            and self.y1 - self.y0 >= width
            and self.z1 - self.z0 >= height
        )
