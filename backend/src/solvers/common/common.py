import sys
from src.domain.entities import Item, Vehicle

def validate_constraints(vehicle: Vehicle, items: list[Item]) -> bool:
    """
    Checks if the data respects the problem constraints.
    Prints warnings to stderr if constraints are not respected.

    Constraints:
        20 ≤ L ≤ 400, 20 ≤ W ≤ 210, 20 ≤ H ≤ 220
        1 ≤ M ≤ 1000
        10 ≤ Li ≤ 500, 10 ≤ Wi ≤ 500, 10 ≤ Hi ≤ 500
        -1 ≤ Di ≤ 1000

    Args:
        vehicle: The vehicle object containing dimensions.
        items: The list of items to be packed.

    Returns:
        True if all constraints are respected, False otherwise.
    """
    valid = True

    # Vehicle checks
    if not (20 <= vehicle.L <= 400):
        print(
            f"Warning: Vehicle length {vehicle.L} out of bounds [20, 400]",
            file=sys.stderr,
        )
        valid = False
    if not (20 <= vehicle.W <= 210):
        print(
            f"Warning: Vehicle width {vehicle.W} out of bounds [20, 210]",
            file=sys.stderr,
        )
        valid = False
    if not (20 <= vehicle.H <= 220):
        print(
            f"Warning: Vehicle height {vehicle.H} out of bounds [20, 220]",
            file=sys.stderr,
        )
        valid = False

    # Articles number verification
    M = len(items)
    if not (1 <= M <= 1000):
        print(f"Warning: Number of items {M} out of bounds [1, 1000]", file=sys.stderr)
        valid = False

    # Articles verification
    for item in items:
        if not (10 <= item.length <= 500):
            print(
                f"Warning: Item {item.id} length {item.length} out of bounds [10, 500]",
                file=sys.stderr,
            )
            valid = False
        if not (10 <= item.width <= 500):
            print(
                f"Warning: Item {item.id} width {item.width} out of bounds [10, 500]",
                file=sys.stderr,
            )
            valid = False
        if not (10 <= item.height <= 500):
            print(
                f"Warning: Item {item.id} height {item.height} out of bounds [10, 500]",
                file=sys.stderr,
            )
            valid = False
        if not (-1 <= item.D <= 1000):
            print(
                f"Warning: Item {item.id} delivery order {item.D} out of bounds [-1, 1000]",
                file=sys.stderr,
            )
            valid = False

    return valid
