.PHONY: help install api generate docs clean clean-tests clean-benchmarks clean-docs clean-all

BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)RPC Project - Bin Packing 3D$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	pip install -r requirements.txt
	@echo "$(GREEN)✓ Installation completed$(NC)"

api: ## Start FastAPI server
	@echo "$(BLUE)Starting FastAPI...$(NC)"
	uvicorn src.api.v1.router:app --host 0.0.0.0 --port 8000

generate: ## Generate test instances
	@echo "$(BLUE)Generate test instances...$(NC)"
	python src/generate_tests.py --output-dir tests/instances --count 5
	@echo "$(GREEN)✓ Tests generated in tests/instances/$(NC)"

docs: ## Génère la documentation HTML
	@echo "$(BLUE)Génération de la documentation...$(NC)"
	$(MAKE) -C docs html
	@echo "$(GREEN)✓ Documentation générée dans docs/_build/html/index.html$(NC)"

clean: ## Nettoie les fichiers générés
	@echo "$(BLUE)Nettoyage...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name ".DS_Store" -delete
	@echo "$(GREEN)✓ Nettoyage terminé$(NC)"

clean-tests: ## Supprime tous les tests générés
	@echo "$(YELLOW)⚠ Suppression des tests générés...$(NC)"
	rm -rf tests/instances/*.txt
	rm -rf tests/scaling/*.txt
	@echo "$(GREEN)✓ Tests supprimés$(NC)"

clean-benchmarks: ## Supprime tous les résultats de benchmark
	@echo "$(YELLOW)⚠ Suppression des résultats de benchmark...$(NC)"
	rm -rf benchmarks/results/*
	@echo "$(GREEN)✓ Résultats supprimés$(NC)"

clean-docs: ## Supprime la documentation générée
	@echo "$(YELLOW)⚠ Suppression de la documentation générée...$(NC)"
	rm -rf docs/_build/
	@echo "$(GREEN)✓ Documentation supprimée$(NC)"

clean-all: clean clean-tests clean-benchmarks ## Nettoie tout

# Catch-all target to allow arguments (e.g. make cp input.txt)
%:
	@:

.DEFAULT_GOAL := help
