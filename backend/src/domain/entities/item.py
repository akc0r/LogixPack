"""
Defines the Item and PlacedItem classes.
"""

from dataclasses import dataclass


@dataclass
class Item:
    """
    Represents an item to be packed.

    Attributes:
        id: Unique identifier for the item.
        length: Length of the item.
        width: Width of the item.
        height: Height of the item.
        D: Delivery order (-1 if no specific order).
        volume: Volume of the item (calculated automatically).
    """

    id: int
    length: int
    width: int
    height: int
    D: int  # delivery order (-1 if no order)
    volume: int = 0

    def __post_init__(self):
        """Calculates the volume of the item after initialization."""
        self.volume = self.length * self.width * self.height


@dataclass
class PlacedItem(Item):
    """
    Represents an item that has been placed in a vehicle.
    Inherits from Item and adds position and orientation information.

    Attributes:
        x0, y0, z0: Coordinates of the bottom-left-back corner.
        x1, y1, z1: Coordinates of the top-right-front corner.
        orientation: Tuple (length, width, height) representing the dimensions used.
        vehicle_id: ID of the vehicle containing the item.
    """

    x0: int = 0
    y0: int = 0
    z0: int = 0
    x1: int = 0
    y1: int = 0
    z1: int = 0
    orientation: tuple[int, int, int] = (0, 0, 0)
    vehicle_id: int = 0

    def __init__(
        self,
        item: Item,
        x0: int,
        y0: int,
        z0: int,
        x1: int,
        y1: int,
        z1: int,
        orientation: tuple[int, int, int],
        vehicle_id: int = 0,
    ):
        """
        Initializes a PlacedItem from an existing Item and placement details.
        """
        super().__init__(
            item.id, item.length, item.width, item.height, item.D, item.volume
        )
        self.x0 = x0
        self.y0 = y0
        self.z0 = z0
        self.x1 = x1
        self.y1 = y1
        self.z1 = z1
        self.orientation = orientation
        self.vehicle_id = vehicle_id

    def get_bounds(self) -> tuple[int, int, int, int, int, int]:
        """Returns the bounding box coordinates (x0, y0, z0, x1, y1, z1)."""
        return self.x0, self.y0, self.z0, self.x1, self.y1, self.z1
