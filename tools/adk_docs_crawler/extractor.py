"""Content extraction from HTML - preserves structure and code blocks"""

import logging
from bs4 import BeautifulSoup, NavigableString
from typing import Dict, List, Any
import json
from pathlib import Path

logger = logging.getLogger(__name__)


class ContentExtractor:
    """Extract structured content from crawled HTML pages"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config["extraction"]
        self.min_length = self.config["min_content_length"]

    def extract(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract structured content from all pages.

        Returns:
            list: Documents with extracted content
        """
        logger.info(f"🔍 Extracting content from {len(pages)} pages...")

        docs = []
        for page in pages:
            try:
                doc = self._extract_page(page)
                if doc:
                    docs.append(doc)
            except Exception as e:
                logger.error(f"❌ Extraction failed for {page['url']}: {e}")

        logger.info(f"✅ Extracted {len(docs)} documents")
        return docs

    def _extract_page(self, page: Dict[str, Any]) -> Dict[str, Any] | None:
        """Extract content from single page"""
        soup = BeautifulSoup(page["raw_html"], "html.parser")

        # Remove nav, footer, script, style
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        # Extract sections
        sections = self._extract_sections(soup)

        if not sections:
            logger.warning(f"⚠️  No content extracted from {page['url']}")
            return None

        return {
            "doc_id": page["doc_id"],
            "url": page["url"],
            "title": page["title"],
            "sections": sections,
            "last_crawled_at": page["last_crawled_at"],
            "source_type": "adk-docs",
        }

    def _extract_sections(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract sections with headings and code blocks"""
        sections = []
        current_section = {"heading_path": [], "text": "", "code_blocks": []}

        for element in soup.find("body").descendants if soup.find("body") else []:
            if element.name in ["h1", "h2", "h3", "h4", "h5", "h6"]:
                if current_section["text"].strip():
                    sections.append(current_section)

                current_section = {
                    "heading_path": [element.get_text().strip()],
                    "text": "",
                    "code_blocks": [],
                }

            elif element.name == "pre":
                code_elem = element.find("code")
                if code_elem:
                    lang = code_elem.get("class", [""])[0].replace("language-", "")
                    current_section["code_blocks"].append({
                        "language": lang or "text",
                        "code": code_elem.get_text().strip(),
                    })

            elif isinstance(element, NavigableString) and element.parent.name not in ["script", "style"]:
                text = str(element).strip()
                if text:
                    current_section["text"] += text + " "

        if current_section["text"].strip():
            sections.append(current_section)

        return sections

    def save_docs(self, docs: List[Dict[str, Any]], output_path: str | Path) -> None:
        """Save extracted documents to JSONL"""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w") as f:
            for doc in docs:
                f.write(json.dumps(doc) + "\n")

        logger.info(f"📄 Saved {len(docs)} docs to {output_path}")
