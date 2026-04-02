import sys
from typing import TextIO


def read_input(file_handle: TextIO = sys.stdin) -> tuple[tuple[int, int, int], int, list[tuple[int, int, int, int]]]:
    """
    Reads the input in the specified format.

    Format:
    L W H
    M
    l1 w1 h1 d1
    ...
    lM wM hM dM

    Args:
        file_handle: File object to read from (default: stdin).

    Returns:
        A tuple containing:
        - (L, W, H): Dimensions of the vehicle.
        - M: Number of items.
        - items: List of tuples (l, w, h, d) for each item.
    """
    lines = file_handle.readlines()

    # Line 1: Vehicle dimensions
    # Filter out empty lines if any
    lines = [line.strip() for line in lines if line.strip()]
    
    if not lines:
        raise ValueError("Empty input file")

    L, W, H = map(int, lines[0].split())

    # Line 2: Number of items
    M = int(lines[1])

    # Following lines: Items
    items = []
    for i in range(M):
        if i + 2 < len(lines):
            l, w, h, d = map(int, lines[2 + i].split())
            items.append((l, w, h, d))
        else:
            break # Should not happen if file is correct

    return (L, W, H), M, items
