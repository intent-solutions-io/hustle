"""
CLI entrypoint for ADK Docs Crawler

Usage:
    python -m tools.adk_docs_crawler run       # Full pipeline
    python -m tools.adk_docs_crawler crawl     # Crawl only
    python -m tools.adk_docs_crawler extract   # Extract only
    python -m tools.adk_docs_crawler chunk     # Chunk only
    python -m tools.adk_docs_crawler upload    # Upload only
"""

import sys
import logging
import argparse
from pathlib import Path

from .config import load_config
from .crawler import ADKDocsCrawler
from .extractor import ContentExtractor
from .chunker import RAGChunker
from .uploader import GCSUploader


def setup_logging(config):
    """Configure logging"""
    log_config = config["logging"]
    level = getattr(logging, log_config["level"])

    handlers = [logging.StreamHandler()]
    if log_config.get("log_to_file"):
        log_file = Path(log_config["log_file"])
        log_file.parent.mkdir(parents=True, exist_ok=True)
        handlers.append(logging.FileHandler(log_file))

    logging.basicConfig(
        level=level,
        format=log_config["format"],
        handlers=handlers
    )


def run_pipeline(config, skip_upload=False):
    """Run complete pipeline"""
    logger = logging.getLogger(__name__)
    logger.info("🚀 Starting ADK Docs Crawler Pipeline")

    # Paths
    output = config["output"]
    manifest_path = Path(output["manifest_file"])
    docs_path = Path(output["raw_docs_file"])
    chunks_path = Path(output["chunks_file"])

    # Step 1: Crawl
    logger.info("\n" + "="*80)
    logger.info("Step 1: Crawling")
    logger.info("="*80)

    crawler = ADKDocsCrawler(config)
    try:
        pages = crawler.crawl()
        crawler.save_manifest(manifest_path)
    finally:
        crawler.close()

    # Step 2: Extract
    logger.info("\n" + "="*80)
    logger.info("Step 2: Extracting")
    logger.info("="*80)

    extractor = ContentExtractor(config)
    docs = extractor.extract(pages)
    extractor.save_docs(docs, docs_path)

    # Step 3: Chunk
    logger.info("\n" + "="*80)
    logger.info("Step 3: Chunking")
    logger.info("="*80)

    chunker = RAGChunker(config)
    chunks = chunker.chunk(docs)
    chunker.save_chunks(chunks, chunks_path)

    # Step 4: Upload
    if not skip_upload:
        logger.info("\n" + "="*80)
        logger.info("Step 4: Uploading")
        logger.info("="*80)

        uploader = GCSUploader(config)
        uploaded = uploader.upload(docs_path, chunks_path, manifest_path)

        logger.info("\n✅ Pipeline complete!")
        logger.info("\n📦 Artifacts uploaded:")
        for key, path in uploaded.items():
            logger.info(f"  • {key}: {path}")
    else:
        logger.info("\n✅ Pipeline complete (skipped upload)")
        logger.info(f"\n📂 Local files:")
        logger.info(f"  • Manifest: {manifest_path}")
        logger.info(f"  • Docs: {docs_path}")
        logger.info(f"  • Chunks: {chunks_path}")

    # Summary
    logger.info(f"\n📊 Summary:")
    logger.info(f"  • Pages crawled: {len(pages)}")
    logger.info(f"  • Documents: {len(docs)}")
    logger.info(f"  • Chunks: {len(chunks)}")


def main():
    parser = argparse.ArgumentParser(description="ADK Docs Crawler for Hustle")
    parser.add_argument("command", choices=["run", "crawl", "extract", "chunk", "upload"],
                        help="Command to execute")
    parser.add_argument("--skip-upload", action="store_true",
                        help="Skip GCS upload (for testing)")
    parser.add_argument("--config", type=str, help="Path to config.yaml")

    args = parser.parse_args()

    try:
        # Load config
        config = load_config(args.config)
        setup_logging(config)

        # Execute command
        if args.command == "run":
            run_pipeline(config, skip_upload=args.skip_upload)
        else:
            print(f"Command '{args.command}' not yet implemented")
            print("Use 'run' for full pipeline")
            sys.exit(1)

    except Exception as e:
        logging.error(f"❌ Pipeline failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
