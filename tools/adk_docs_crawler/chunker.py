"""RAG chunking logic - splits docs into queryable segments"""

import logging
import hashlib
import json
from typing import Dict, List, Any
from pathlib import Path

logger = logging.getLogger(__name__)


class RAGChunker:
    """Create RAG-ready chunks from extracted documents"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config["chunking"]
        self.max_tokens = self.config["max_chunk_tokens"]
        self.overlap = self.config["overlap_tokens"]

    def chunk(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Create RAG chunks from documents.

        Returns:
            list: Chunks with metadata
        """
        logger.info(f"✂️  Chunking {len(docs)} documents...")

        chunks = []
        for doc in docs:
            try:
                doc_chunks = self._chunk_document(doc)
                chunks.extend(doc_chunks)
            except Exception as e:
                logger.error(f"❌ Chunking failed for {doc['url']}: {e}")

        logger.info(f"✅ Created {len(chunks)} chunks")
        return chunks

    def _chunk_document(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Chunk single document by sections"""
        chunks = []

        for idx, section in enumerate(doc["sections"]):
            text = section["text"].strip()

            if not text or len(text) < 50:  # Skip tiny sections
                continue

            # Estimate tokens (rough: ~4 chars per token)
            estimated_tokens = len(text) // 4

            if estimated_tokens > self.max_tokens:
                # Split long sections
                sub_chunks = self._split_long_section(text, self.max_tokens * 4)
                for sub_idx, sub_text in enumerate(sub_chunks):
                    chunks.append(self._create_chunk(
                        doc, section, sub_text, f"{idx}-{sub_idx}"
                    ))
            else:
                chunks.append(self._create_chunk(doc, section, text, str(idx)))

        return chunks

    def _split_long_section(self, text: str, max_chars: int) -> List[str]:
        """Split text into chunks respecting word boundaries"""
        chunks = []
        words = text.split()
        current = []
        current_len = 0

        for word in words:
            word_len = len(word) + 1  # +1 for space
            if current_len + word_len > max_chars and current:
                chunks.append(" ".join(current))
                # Overlap: keep last 20% of words
                overlap_size = max(1, len(current) // 5)
                current = current[-overlap_size:]
                current_len = sum(len(w) + 1 for w in current)

            current.append(word)
            current_len += word_len

        if current:
            chunks.append(" ".join(current))

        return chunks

    def _create_chunk(self, doc: Dict, section: Dict, text: str, chunk_idx: str) -> Dict:
        """Create chunk with full metadata"""
        chunk_id = hashlib.sha256(f"{doc['doc_id']}-{chunk_idx}".encode()).hexdigest()

        return {
            "chunk_id": chunk_id,
            "doc_id": doc["doc_id"],
            "url": doc["url"],
            "title": doc["title"],
            "heading_path": section["heading_path"],
            "text": text,
            "code_blocks": section.get("code_blocks", []),
            "source_type": "adk-docs",
            "last_crawled_at": doc["last_crawled_at"],
        }

    def save_chunks(self, chunks: List[Dict[str, Any]], output_path: str | Path) -> None:
        """Save chunks to JSONL"""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w") as f:
            for chunk in chunks:
                f.write(json.dumps(chunk) + "\n")

        logger.info(f"📄 Saved {len(chunks)} chunks to {output_path}")
