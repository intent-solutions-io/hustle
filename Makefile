# Hustle Makefile - Development and Operations Commands

.PHONY: help
help: ## Show this help message
	@echo "Hustle - Youth Soccer Stats Platform"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'

#===============================================================================
# ADK Docs Crawler - Production Pipeline
#===============================================================================

.PHONY: crawl-adk-docs
crawl-adk-docs: ## Crawl ADK documentation and upload to GCS
	@echo "🕷️  Starting ADK docs crawler pipeline..."
	@python -m tools.adk_docs_crawler run

.PHONY: crawl-adk-docs-local
crawl-adk-docs-local: ## Crawl ADK docs without uploading (local testing)
	@echo "🕷️  Crawling ADK docs (local only)..."
	@python -m tools.adk_docs_crawler run --skip-upload

.PHONY: setup-crawler
setup-crawler: ## Install crawler dependencies
	@echo "📦 Installing ADK crawler dependencies..."
	@pip install -r tools/adk_docs_crawler/requirements.txt

.PHONY: test-crawler-config
test-crawler-config: ## Test crawler configuration
	@echo "🔧 Testing crawler configuration..."
	@python -m tools.adk_docs_crawler.config

.PHONY: gen-crawler-env
gen-crawler-env: ## Generate .env template for crawler
	@python -m tools.adk_docs_crawler.config template > .env.crawler.template
	@echo "✅ Template saved to .env.crawler.template"

#===============================================================================
# Development
#===============================================================================

.PHONY: dev
dev: ## Start development server
	@echo "🚀 Starting dev server..."
	@npm run dev

.PHONY: build
build: ## Build for production
	@echo "🏗️  Building for production..."
	@npm run build

.PHONY: test
test: ## Run all tests
	@echo "🧪 Running tests..."
	@npm test

.PHONY: lint
lint: ## Run linter
	@echo "🔍 Running linter..."
	@npm run lint

#===============================================================================
# Clean
#===============================================================================

.PHONY: clean-crawler
clean-crawler: ## Clean crawler temporary files
	@echo "🧹 Cleaning crawler artifacts..."
	@rm -rf tmp/adk_crawler
	@echo "✅ Cleaned"

.PHONY: clean
clean: clean-crawler ## Clean all temporary files
	@echo "🧹 Cleaning all temporary files..."
	@rm -rf tmp/
	@rm -rf .next/
	@echo "✅ Cleaned"
