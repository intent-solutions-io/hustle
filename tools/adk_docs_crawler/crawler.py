"""
ADK Docs Crawler - Site Discovery and Content Fetching

Crawls google.github.io/adk-docs/ respecting robots.txt and rate limits.
"""

import time
import logging
import hashlib
import requests
from urllib.parse import urljoin, urlparse, urldefrag
from urllib.robotparser import RobotFileParser
from bs4 import BeautifulSoup
from typing import Dict, Set, List, Any
from datetime import datetime
import json
from pathlib import Path

logger = logging.getLogger(__name__)


class ADKDocsCrawler:
    """
    Production-grade web crawler for ADK documentation.

    Features:
    - Respects robots.txt
    - Rate limiting between requests
    - URL normalization and deduplication
    - Scope limiting (only crawl allowed domains/paths)
    - Timeout handling
    - Error recovery
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize crawler with configuration.

        Args:
            config: Configuration dict from config.yaml
        """
        self.config = config
        self.crawler_config = config["crawler"]

        self.base_url = self.crawler_config["base_url"]
        self.allowed_domains = set(self.crawler_config["allowed_domains"])
        self.allowed_paths = self.crawler_config["allowed_paths"]
        self.user_agent = self.crawler_config["user_agent"]
        self.rate_limit = self.crawler_config["rate_limit_seconds"]
        self.timeout = self.crawler_config["timeout_seconds"]
        self.respect_robots = self.crawler_config["respect_robots_txt"]
        self.max_pages = self.crawler_config["max_pages"]

        # State tracking
        self.visited_urls: Set[str] = set()
        self.to_visit: List[str] = [self.base_url]
        self.pages: List[Dict[str, Any]] = []

        # Robots.txt parser
        self.robot_parser: RobotFileParser | None = None
        if self.respect_robots:
            self._init_robots_txt()

        # Session for connection pooling
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": self.user_agent})

        # Last request time for rate limiting
        self.last_request_time = 0

        logger.info(f"Crawler initialized: {self.base_url}")

    def _init_robots_txt(self) -> None:
        """Load and parse robots.txt"""
        try:
            robots_url = urljoin(self.base_url, "/robots.txt")
            self.robot_parser = RobotFileParser(robots_url)
            self.robot_parser.read()
            logger.info(f"Loaded robots.txt from {robots_url}")
        except Exception as e:
            logger.warning(f"Could not load robots.txt: {e}. Proceeding anyway.")
            self.robot_parser = None

    def _can_fetch(self, url: str) -> bool:
        """
        Check if URL can be fetched according to robots.txt.

        Args:
            url: URL to check

        Returns:
            bool: True if allowed to fetch
        """
        if not self.respect_robots or not self.robot_parser:
            return True

        try:
            return self.robot_parser.can_fetch(self.user_agent, url)
        except:
            return True  # Err on side of allowing if parse fails

    def _is_allowed_url(self, url: str) -> bool:
        """
        Check if URL is within allowed scope.

        Args:
            url: URL to check

        Returns:
            bool: True if within allowed domain and path
        """
        parsed = urlparse(url)

        # Check domain
        if parsed.netloc not in self.allowed_domains:
            return False

        # Check path prefix
        path_allowed = any(
            parsed.path.startswith(allowed_path)
            for allowed_path in self.allowed_paths
        )

        return path_allowed

    def _normalize_url(self, url: str) -> str:
        """
        Normalize URL by removing fragments and trailing slashes.

        Args:
            url: URL to normalize

        Returns:
            str: Normalized URL
        """
        # Remove fragment
        url, _ = urldefrag(url)

        # Remove trailing slash (except for root)
        if url.endswith("/") and url != self.base_url:
            url = url.rstrip("/")

        return url

    def _rate_limit_wait(self) -> None:
        """Wait if necessary to respect rate limit"""
        if self.rate_limit > 0:
            elapsed = time.time() - self.last_request_time
            if elapsed < self.rate_limit:
                time.sleep(self.rate_limit - elapsed)

        self.last_request_time = time.time()

    def _fetch_page(self, url: str) -> Dict[str, Any] | None:
        """
        Fetch a single page and extract metadata.

        Args:
            url: URL to fetch

        Returns:
            dict: Page data with url, title, html, links
            None: If fetch fails
        """
        # Rate limiting
        self._rate_limit_wait()

        try:
            logger.debug(f"Fetching: {url}")

            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()

            # Parse HTML
            soup = BeautifulSoup(response.text, "html.parser")

            # Extract title
            title_tag = soup.find("title")
            title = title_tag.get_text().strip() if title_tag else url

            # Extract internal links
            links = self._extract_links(soup, url)

            # Generate stable doc ID
            doc_id = hashlib.sha256(url.encode()).hexdigest()

            page_data = {
                "doc_id": doc_id,
                "url": url,
                "title": title,
                "raw_html": response.text,
                "links": links,
                "last_crawled_at": datetime.utcnow().isoformat(),
                "status_code": response.status_code,
                "content_type": response.headers.get("Content-Type", ""),
            }

            logger.info(f"✅ Fetched: {url} ({len(links)} links found)")

            return page_data

        except requests.RequestException as e:
            logger.error(f"❌ Failed to fetch {url}: {e}")
            return None

    def _extract_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """
        Extract and normalize all links from HTML.

        Args:
            soup: BeautifulSoup parsed HTML
            base_url: Base URL for resolving relative links

        Returns:
            list: Normalized absolute URLs within allowed scope
        """
        links = []

        for anchor in soup.find_all("a", href=True):
            href = anchor["href"]

            # Skip empty, anchor-only, or javascript links
            if not href or href.startswith("#") or href.startswith("javascript:"):
                continue

            # Make absolute
            absolute_url = urljoin(base_url, href)

            # Normalize
            normalized_url = self._normalize_url(absolute_url)

            # Check if allowed
            if self._is_allowed_url(normalized_url):
                links.append(normalized_url)

        return links

    def crawl(self) -> List[Dict[str, Any]]:
        """
        Crawl the entire site starting from base_url.

        Returns:
            list: All successfully crawled pages
        """
        logger.info("=" * 80)
        logger.info(f"🕷️  Starting crawl of {self.base_url}")
        logger.info("=" * 80)

        while self.to_visit and len(self.pages) < self.max_pages:
            url = self.to_visit.pop(0)

            # Skip if already visited
            if url in self.visited_urls:
                continue

            # Check robots.txt
            if not self._can_fetch(url):
                logger.warning(f"⛔ Robots.txt disallows: {url}")
                self.visited_urls.add(url)
                continue

            # Mark as visited
            self.visited_urls.add(url)

            # Fetch page
            page_data = self._fetch_page(url)

            if page_data:
                self.pages.append(page_data)

                # Add new links to queue
                for link in page_data["links"]:
                    if link not in self.visited_urls and link not in self.to_visit:
                        self.to_visit.append(link)

            # Progress logging
            if len(self.pages) % 10 == 0:
                logger.info(
                    f"Progress: {len(self.pages)} pages crawled, "
                    f"{len(self.to_visit)} in queue"
                )

        logger.info("=" * 80)
        logger.info(f"✅ Crawl complete: {len(self.pages)} pages")
        logger.info("=" * 80)

        return self.pages

    def save_manifest(self, output_path: str | Path) -> None:
        """
        Save crawl manifest to JSON file.

        Args:
            output_path: Path to save manifest.json
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        manifest = {
            "base_url": self.base_url,
            "crawled_at": datetime.utcnow().isoformat(),
            "total_pages": len(self.pages),
            "pages_visited": len(self.visited_urls),
            "pages": [
                {
                    "doc_id": page["doc_id"],
                    "url": page["url"],
                    "title": page["title"],
                    "links_count": len(page["links"]),
                    "last_crawled_at": page["last_crawled_at"],
                }
                for page in self.pages
            ],
        }

        with open(output_path, "w") as f:
            json.dump(manifest, f, indent=2)

        logger.info(f"📄 Manifest saved: {output_path}")

    def close(self) -> None:
        """Close HTTP session"""
        self.session.close()


if __name__ == "__main__":
    # Test crawler
    from .config import load_config

    config = load_config()
    crawler = ADKDocsCrawler(config)

    try:
        pages = crawler.crawl()
        manifest_path = config["output"]["manifest_file"]
        crawler.save_manifest(manifest_path)

        print(f"\n✅ Crawled {len(pages)} pages")
        print(f"📄 Manifest: {manifest_path}")

    finally:
        crawler.close()
