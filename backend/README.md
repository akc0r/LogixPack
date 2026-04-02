# Projet RPC - Bin Packing 3D avec Contraintes d'Ordre de Livraison

## Description

Résolution du problème de bin packing 3D avec contraintes d'ordre de livraison.

Le projet implémente deux approches conformes au sujet :

1. **Solveur générique** : CP (Programmation par Contraintes avec OR-Tools)
2. **Approche ad-hoc** : Heuristiques (First Fit Decreasing, Layer-based, Free Space)
   → Implémentation manuelle **sans bibliothèque externe**

## Installation

```bash

# Créer l'environnement virtuel et installer les dépendances

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Structure du Projet

```
projet-rpc/
├── src/
│ ├── ad_hoc/
│ │ ├── first_fit_decreasing_solution.py
│ │ ├── free_space_solution.py
│ │ ├── layer_based_solution.py
│ │ └── utils.py
│ ├── core/
│ │ ├── item.py
│ │ ├── vehicle.py
│ │ ├── solution.py
│ │ └── free_space.py
│ ├── generic_solver/
│ │ └── solver_cp.py
│ ├── benchmark.py
│ ├── common.py
│ ├── generate_tests.py
│ ├── reader.py
│ └── visualize.py
├── docs/ # Documentation
│ ├── index.rst
│ ├── modules.rst
│ └── ...
├── tests/
│ ├── instances/
│ ├── outputs/
│ └── samples/
├── benchmarks/
├── main.py
└── Makefile
```

## Utilisation

### Lancer le programme principal

```bash
python main.py [options]
```

### Commandes Make

Le projet inclut un \`Makefile\` pour simplifier les tâches courantes :

```bash
make help # Affiche toutes les commandes disponibles
make install # Installe les dépendances
make cp # Lance le solveur CP
make adhoc # Lance le solveur Ad-Hoc
make generate # Génère les jeux de tests
make benchmark # Lance le benchmark complet
make docs # Génère la documentation HTML
```

### Générer la documentation

La documentation est générée à partir des docstrings du code source via Sphinx.

```bash
make docs
```

La documentation sera disponible dans \`docs/\_build/html/index.html\`.

### Tests rapides

```bash

# Lancer un benchmark

python src/benchmark.py

# Visualiser une solution

make visualize input.txt DIM=60x50x50
```
