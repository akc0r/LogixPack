# 📦 RPC Backend - 3D Bin Packing Solver

Welcome to the backend solver for the **3D Bin Packing Problem with Delivery Order Constraints**. 
This module forms the core reasoning and calculation engine of the project, providing advanced combinatorial optimization and heuristic approaches to pack vehicles efficiently while ensuring the Last-In-First-Out (LIFO) delivery requirement.

## 🚀 Overview

The backend solver implements two primary strategies as requested in the project specifications:

1. **Generic Solver (CP)**: Utilizes Constraint Programming through [Google OR-Tools](https://developers.google.com/optimization). It formally defines the constraints (non-overlap, boundaries, orientation, and delivery order) to explore the solution space optimally or near-optimally.
2. **Ad-Hoc Approaches (Heuristics)**: Custom-built logic written from scratch without external optimization libraries.
   * *First Fit Decreasing (FFD)*: A greedy approach sorting items by size.
   * *Layer-based*: Packs items into vertical layers.
   * *Free Space*: Dynamically tracks available 3D empty spaces to insert items efficiently.

## 🛠️ Installation

Requirements: **Python 3.10+**.

```bash
# 1. Create a virtual environment
python3 -m venv .venv

# 2. Activate it
# On Mac/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# 3. Install the dependencies
pip install -r requirements.txt
```

## 🏗️ Architecture & Structure

```text
backend/
├── src/
│   ├── ad_hoc/                   # Custom heuristic algorithms
│   │   ├── first_fit_decreasing_solution.py
│   │   ├── free_space_solution.py
│   │   ├── layer_based_solution.py
│   │   └── utils.py
│   ├── core/                     # Core business logic and models
│   │   ├── item.py               # Item representation
│   │   ├── vehicle.py            # Vehicle and space definition
│   │   ├── solution.py           # Output solution format
│   │   └── free_space.py         # 3D free space management
│   ├── generic_solver/           # Constraint Programming Approach
│   │   └── solver_cp.py          # OR-Tools implementation
│   ├── benchmark.py              # Performance evaluation scripts
│   ├── common.py                 # Shared utilities
│   ├── generate_tests.py         # Test data generators
│   ├── reader.py                 # Input parser
│   └── visualize.py              # CLI visualization tooling
├── docs/                         # Sphinx documentation
├── tests/                        # Unit tests and sample files
├── benchmarks/                   # Output of benchmark runs
├── main.py                       # CLI entry point
└── Makefile                      # Task runner
```

## 💻 Usage

We provide a `Makefile` to streamline interactions with the backend, allowing quick executions, benchmarks, and documentation generation.

### Available Commands

```bash
make help        # Display all available make commands
make install     # Install Python dependencies
make cp          # Run the OR-Tools Constraint Programming solver
make adhoc       # Run the Ad-Hoc Heuristics solver
make generate    # Generate synthetic test instances
make benchmark   # Execute a full suite of benchmarks
make docs        # Generate the HTML documentation (Sphinx)
```

### Manual Execution

You can run the application directly via the `main.py` entry point to supply custom arguments:

```bash
python main.py [options]
```

### Visualizing Solutions

To visualize the packing results for a specific set of dimensions:
```bash
make visualize input.txt DIM=60x50x50
```

### Running the Benchmarks Manually

```bash
python src/benchmark.py
```

## 📚 Documentation

The technical documentation is generated dynamically using Sphinx, extracting Python docstrings directly from the source code.

```bash
make docs
```

After generation, open the documentation at:
`docs/_build/html/index.html`

---

*Developed as part of the EPITA S9 RPC Project.*
