"""
Defines the Solution class.
"""

from .item import PlacedItem


class Solution:
    """
    Represents a solution to the bin packing problem.

    Attributes:
        status: Status of the solution ('SAT' or 'UNSAT').
        items: List of placed items.
        num_vehicles: Number of vehicles used.
        solve_time: Time taken to solve (in seconds).
        objective: Value of the objective function (usually num_vehicles).
    """

    def __init__(
        self,
        status: str,
        items: list[PlacedItem],
        num_vehicles: int = 0,
        solve_time: float = 0.0,
        objective: float = 0.0,
    ):
        """
        Initializes a Solution object.

        Args:
            status: 'SAT' or 'UNSAT'.
            items: List of PlacedItem objects.
            num_vehicles: Number of vehicles used.
            solve_time: Solve time in seconds.
            objective: Objective function value.
        """
        self.status = status
        self.items = items or []
        self.num_vehicles = num_vehicles
        self.solve_time = solve_time
        self.objective = objective

    def is_feasible(self) -> bool:
        """Checks if the solution is feasible (SAT)."""
        return self.status == "SAT"

    def __repr__(self) -> str:
        if self.is_feasible():
            return (
                f"Solution(status={self.status}, vehicles={self.num_vehicles}, "
                f"items={len(self.items)}, time={self.solve_time:.2f}s)"
            )
        return f"Solution(status={self.status})"
