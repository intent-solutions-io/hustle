"""
ADK Docs Crawler for Hustle

Production-grade pipeline for crawling, extracting, and indexing
Google Agent Development Kit documentation for RAG/grounding use cases.

Components:
- crawler: Site discovery and content fetching
- extractor: HTML/Markdown parsing and normalization
- chunker: RAG-ready chunking with metadata
- uploader: GCS upload with structured paths

Usage:
    python -m tools.adk_docs_crawler crawl
    python -m tools.adk_docs_crawler upload
    python -m tools.adk_docs_crawler run  # Full pipeline
"""

__version__ = "1.0.0"
__author__ = "Hustle Team"
__license__ = "MIT"

from .config import load_config
from .crawler import ADKDocsCrawler
from .extractor import ContentExtractor
from .chunker import RAGChunker
from .uploader import GCSUploader

__all__ = [
    "load_config",
    "ADKDocsCrawler",
    "ContentExtractor",
    "RAGChunker",
    "GCSUploader",
]
