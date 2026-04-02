"""
Test case generator for the 3D Bin Packing project.
Generates instances of varying difficulty for the three leagues (Bronze, Silver, Gold).
"""

import argparse
import random
import os
from typing import Tuple


def generate_test_case(
    league: str, difficulty: str, seed: int, test_id: int, output_dir: str
):
    """
    Generates a test case based on league and difficulty.

    Args:
        league: 'bronze', 'silver', or 'gold'.
        difficulty: 'easy', 'medium', or 'hard'.
        seed: Seed for random generation.
        test_id: Identifier for the test.
        output_dir: Output directory.
    """
    random.seed(seed)

    # Parameters based on league
    if league == "bronze":
        max_items = 10
        has_delivery = False
    elif league == "silver":
        max_items = 100
        has_delivery = False
    else:  # gold
        max_items = 1000
        has_delivery = True

    # Number of items based on difficulty
    if difficulty == "easy":
        num_items = random.randint(max(2, max_items // 5), max_items // 3)
    elif difficulty == "medium":
        num_items = random.randint(max_items // 3, 2 * max_items // 3)
    else:  # hard
        num_items = random.randint(2 * max_items // 3, max_items)

    # Vehicle dimensions
    if difficulty != "hard":
        vehicle_l = random.randint(50, 200)
        vehicle_w = random.randint(50, 150)
        vehicle_h = random.randint(50, 150)
    else:
        vehicle_l = random.randint(40, 100)
        vehicle_w = random.randint(40, 80)
        vehicle_h = random.randint(40, 80)

    # Round to nearest 10
    vehicle_l = (vehicle_l // 10) * 10
    vehicle_w = (vehicle_w // 10) * 10
    vehicle_h = (vehicle_h // 10) * 10

    items = []
    for _ in range(num_items):
        # Item dimensions (ensure they fit in vehicle)
        l = random.randint(1, min(50, vehicle_l))
        w = random.randint(1, min(50, vehicle_w))
        h = random.randint(1, min(50, vehicle_h))

        # Delivery order
        d = -1
        if has_delivery:
            # 50% chance of having a delivery order
            if random.random() < 0.5:
                d = random.randint(1, 10)

        items.append((l, w, h, d))

    # Write to file
    filename = f"{league}_{difficulty}_{test_id:03d}.txt"
    filepath = os.path.join(output_dir, filename)

    with open(filepath, "w") as f:
        f.write(f"{vehicle_l} {vehicle_w} {vehicle_h}\n")
        f.write(f"{num_items}\n")
        for item in items:
            f.write(f"{item[0]} {item[1]} {item[2]} {item[3]}\n")

    print(f"Generated {filepath}")


def main():
    parser = argparse.ArgumentParser(description="Generate 3D Bin Packing test cases")
    parser.add_argument(
        "--output-dir", type=str, default="tests/instances", help="Output directory"
    )
    parser.add_argument(
        "--count", type=int, default=5, help="Number of tests per category"
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed")

    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    leagues = ["bronze", "silver", "gold"]
    difficulties = ["easy", "medium", "hard"]

    test_id = 0
    for league in leagues:
        for difficulty in difficulties:
            for _ in range(args.count):
                generate_test_case(
                    league, difficulty, args.seed + test_id, test_id, args.output_dir
                )
                test_id += 1


if __name__ == "__main__":
    main()
