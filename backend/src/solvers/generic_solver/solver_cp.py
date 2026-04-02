import sys
import time
import itertools

from ortools.sat.python import cp_model

from src.domain.entities import Item, PlacedItem, Solution, Vehicle


class SolutionPrinter(cp_model.CpSolverSolutionCallback):
    """
    Prints intermediate solutions during the search.
    """

    def __init__(self):
        cp_model.CpSolverSolutionCallback.__init__(self)
        self.__solution_count = 0
        self.__start_time = time.time()

    def on_solution_callback(self):
        current_time = time.time()
        # Print to stderr to avoid polluting stdout which is used for the final result
        print(
            f"Solution {self.__solution_count} found: objective={self.ObjectiveValue()} "
            f"time={current_time - self.__start_time:.2f}s",
            file=sys.stderr,
        )
        self.__solution_count += 1


class ConstraintProgrammingSolver:
    """
    CP Solver for 3D Bin Packing.
    """

    def __init__(
        self,
        vehicle: Vehicle,
        items: list[Item],
        max_vehicles: int | None = None,
        time_limit: int = 300,
    ):
        """
        Initializes the solver.

        Args:
            vehicle: The vehicle template (dimensions).
            items: List of items to pack.
            max_vehicles: Maximum number of vehicles allowed (optional).
            time_limit: Time limit in seconds.
        """
        self.vehicle = vehicle
        self.items = items
        self.n_items = len(items)

        # Estimate max vehicles if not provided
        if max_vehicles is None:
            total_volume = sum(item.volume for item in items)
            # Lower bound based on volume
            self.max_vehicles = min(
                self.n_items,
                (total_volume + vehicle.volume_total() - 1) // vehicle.volume_total()
                + 1,
            )
            # Heuristic increase to be safe
            self.max_vehicles = max(self.max_vehicles, int(self.n_items / 2) + 1)
            if self.max_vehicles > self.n_items:
                self.max_vehicles = self.n_items
        else:
            self.max_vehicles = max_vehicles

        self.time_limit = time_limit
        self.model = cp_model.CpModel()
        self.solution: Solution | None = None

    def _can_fit(self, item: Item) -> bool:
        """Checks if an item can fit in the vehicle in at least one orientation."""
        dims_item = sorted([item.length, item.width, item.height])
        dims_vehicle = sorted([self.vehicle.L, self.vehicle.W, self.vehicle.H])
        return (
            dims_item[0] <= dims_vehicle[0]
            and dims_item[1] <= dims_vehicle[1]
            and dims_item[2] <= dims_vehicle[2]
        )

    def _get_orientations(self, item: Item) -> list[tuple[int, int, int]]:
        """Returns unique valid orientations for an item."""
        dims = [item.length, item.width, item.height]
        perms = set(itertools.permutations(dims))
        valid_perms = []
        for d in perms:
            if (
                d[0] <= self.vehicle.L
                and d[1] <= self.vehicle.W
                and d[2] <= self.vehicle.H
            ):
                valid_perms.append(d)
        return list(valid_perms)

    def check_feasibility(self) -> bool:
        """Checks if the problem is feasible (no item too large)."""
        for item in self.items:
            if not self._can_fit(item):
                return False
        return True

    def build_model(self):
        """Builds the CP model."""

        # Decision variables
        self.x = []  # Position x
        self.y = []  # Position y
        self.z = []  # Position z
        self.dx = []  # Dimension x (after rotation)
        self.dy = []  # Dimension y
        self.dz = []  # Dimension z
        self.vehicle_id = []  # Vehicle ID

        # End position variables
        self.x_end = []
        self.y_end = []
        self.z_end = []

        for i, item in enumerate(self.items):
            orientations = self._get_orientations(item)

            if len(orientations) == 1:
                dx_val, dy_val, dz_val = orientations[0]
                dx_var = self.model.NewConstant(dx_val)
                dy_var = self.model.NewConstant(dy_val)
                dz_var = self.model.NewConstant(dz_val)
            else:
                orientation_bools = [
                    self.model.NewBoolVar(f"orient_{i}_{k}")
                    for k in range(len(orientations))
                ]
                self.model.Add(sum(orientation_bools) == 1)

                dx_var = self.model.NewIntVar(1, self.vehicle.L, f"dx_{i}")
                dy_var = self.model.NewIntVar(1, self.vehicle.W, f"dy_{i}")
                dz_var = self.model.NewIntVar(1, self.vehicle.H, f"dz_{i}")

                self.model.Add(
                    dx_var
                    == sum(
                        orientations[k][0] * orientation_bools[k]
                        for k in range(len(orientations))
                    )
                )
                self.model.Add(
                    dy_var
                    == sum(
                        orientations[k][1] * orientation_bools[k]
                        for k in range(len(orientations))
                    )
                )
                self.model.Add(
                    dz_var
                    == sum(
                        orientations[k][2] * orientation_bools[k]
                        for k in range(len(orientations))
                    )
                )

            self.dx.append(dx_var)
            self.dy.append(dy_var)
            self.dz.append(dz_var)

            x_var = self.model.NewIntVar(0, self.vehicle.L, f"x_{i}")
            y_var = self.model.NewIntVar(0, self.vehicle.W, f"y_{i}")
            z_var = self.model.NewIntVar(0, self.vehicle.H, f"z_{i}")

            x_end_var = self.model.NewIntVar(0, self.vehicle.L, f"x_end_{i}")
            y_end_var = self.model.NewIntVar(0, self.vehicle.W, f"y_end_{i}")
            z_end_var = self.model.NewIntVar(0, self.vehicle.H, f"z_end_{i}")

            self.model.Add(x_end_var == x_var + dx_var)
            self.model.Add(y_end_var == y_var + dy_var)
            self.model.Add(z_end_var == z_var + dz_var)

            self.model.Add(x_end_var <= self.vehicle.L)
            self.model.Add(y_end_var <= self.vehicle.W)
            self.model.Add(z_end_var <= self.vehicle.H)

            vehicle_var = self.model.NewIntVar(
                0, self.max_vehicles - 1, f"vehicle_{i}"
            )

            self.x.append(x_var)
            self.y.append(y_var)
            self.z.append(z_var)
            self.x_end.append(x_end_var)
            self.y_end.append(y_end_var)
            self.z_end.append(z_end_var)
            self.vehicle_id.append(vehicle_var)

        # Non-overlap constraints
        for i in range(self.n_items):
            for j in range(i + 1, self.n_items):
                same_vehicle = self.model.NewBoolVar(f"same_vehicle_{i}_{j}")
                self.model.Add(self.vehicle_id[i] == self.vehicle_id[j]).OnlyEnforceIf(
                    same_vehicle
                )
                self.model.Add(self.vehicle_id[i] != self.vehicle_id[j]).OnlyEnforceIf(
                    same_vehicle.Not()
                )

                left = self.model.NewBoolVar(f"left_{i}_{j}")
                right = self.model.NewBoolVar(f"right_{i}_{j}")
                behind = self.model.NewBoolVar(f"behind_{i}_{j}")
                front = self.model.NewBoolVar(f"front_{i}_{j}")
                below = self.model.NewBoolVar(f"below_{i}_{j}")
                above = self.model.NewBoolVar(f"above_{i}_{j}")

                self.model.Add(self.x_end[i] <= self.x[j]).OnlyEnforceIf(left)
                self.model.Add(self.x_end[j] <= self.x[i]).OnlyEnforceIf(right)
                self.model.Add(self.y_end[i] <= self.y[j]).OnlyEnforceIf(behind)
                self.model.Add(self.y_end[j] <= self.y[i]).OnlyEnforceIf(front)
                self.model.Add(self.z_end[i] <= self.z[j]).OnlyEnforceIf(below)
                self.model.Add(self.z_end[j] <= self.z[i]).OnlyEnforceIf(above)

                self.model.AddBoolOr(
                    [left, right, behind, front, below, above]
                ).OnlyEnforceIf(same_vehicle)

        # Delivery order constraints
        for i in range(self.n_items):
            for j in range(self.n_items):
                if i != j:
                    item_i = self.items[i]
                    item_j = self.items[j]

                    if (
                        item_i.D != -1
                        and item_j.D != -1
                        and item_i.D < item_j.D
                    ):
                        same_vehicle = self.model.NewBoolVar(f"delivery_same_{i}_{j}")
                        self.model.Add(
                            self.vehicle_id[i] == self.vehicle_id[j]
                        ).OnlyEnforceIf(same_vehicle)
                        self.model.Add(
                            self.vehicle_id[i] != self.vehicle_id[j]
                        ).OnlyEnforceIf(same_vehicle.Not())

                        b_x_greater = self.model.NewBoolVar(f"x_greater_{i}_{j}")
                        b_z_greater = self.model.NewBoolVar(f"z_greater_{i}_{j}")

                        self.model.Add(self.x[i] >= self.x_end[j]).OnlyEnforceIf(
                            b_x_greater
                        )
                        self.model.Add(self.z[i] >= self.z[j]).OnlyEnforceIf(
                            b_z_greater
                        )

                        self.model.AddBoolOr([b_x_greater, b_z_greater]).OnlyEnforceIf(
                            same_vehicle
                        )

        # Symmetry breaking: first item in vehicle 0
        if self.n_items > 0:
            self.model.Add(self.vehicle_id[0] == 0)

        # Symmetry breaking: item i in vehicle <= i
        for i in range(1, self.n_items):
            self.model.Add(self.vehicle_id[i] <= i)

        # Cumulative volume constraint
        self.is_in_vehicle = {}
        for i in range(self.n_items):
            for v in range(self.max_vehicles):
                self.is_in_vehicle[(i, v)] = self.model.NewBoolVar(f"is_in_{i}_{v}")
                self.model.Add(self.vehicle_id[i] == v).OnlyEnforceIf(
                    self.is_in_vehicle[(i, v)]
                )
                self.model.Add(self.vehicle_id[i] != v).OnlyEnforceIf(
                    self.is_in_vehicle[(i, v)].Not()
                )

        for i in range(self.n_items):
            self.model.Add(
                sum(self.is_in_vehicle[(i, v)] for v in range(self.max_vehicles)) == 1
            )

        vehicle_vol = self.vehicle.volume_total()
        for v in range(self.max_vehicles):
            self.model.Add(
                sum(
                    self.items[i].volume * self.is_in_vehicle[(i, v)]
                    for i in range(self.n_items)
                )
                <= vehicle_vol
            )

        # Objective: minimize used vehicles
        self.vehicle_used = [
            self.model.NewBoolVar(f"vehicle_used_{v}") for v in range(self.max_vehicles)
        ]

        for v in range(self.max_vehicles):
            self.model.AddMaxEquality(
                self.vehicle_used[v],
                [self.is_in_vehicle[(i, v)] for i in range(self.n_items)],
            )

            if v > 0:
                self.model.Add(self.vehicle_used[v] <= self.vehicle_used[v - 1])

        self.model.Minimize(sum(self.vehicle_used))

    def solve(self) -> Solution:
        """
        Solves the model.

        Returns:
            A Solution object.
        """
        start_time = time.time()

        if not self.check_feasibility():
            return Solution("UNSAT", [], 0, time.time() - start_time)

        self.build_model()

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.time_limit
        solver.parameters.log_search_progress = True
        solver.parameters.num_search_workers = 8

        solution_printer = SolutionPrinter()
        status = solver.Solve(self.model, solution_printer)

        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            num_vehicles = int(solver.ObjectiveValue())
            placed_items = []

            for i in range(self.n_items):
                vid = solver.Value(self.vehicle_id[i])
                x = solver.Value(self.x[i])
                y = solver.Value(self.y[i])
                z = solver.Value(self.z[i])
                dx = solver.Value(self.dx[i])
                dy = solver.Value(self.dy[i])
                dz = solver.Value(self.dz[i])

                placed_item = PlacedItem(
                    self.items[i],
                    x,
                    y,
                    z,
                    x + dx,
                    y + dy,
                    z + dz,
                    (dx, dy, dz),
                    vid,
                )
                placed_items.append(placed_item)

            self.solution = Solution(
                "SAT", placed_items, num_vehicles, solver.WallTime()
            )
            return self.solution
        else:
            self.solution = Solution("UNSAT", [], 0, solver.WallTime())
            return self.solution

    def get_solution(self) -> Solution | None:
        """
        Returns the found solution.
        """
        return self.solution
