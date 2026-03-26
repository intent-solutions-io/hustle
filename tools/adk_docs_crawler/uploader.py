"""GCS uploader - uploads artifacts with structured paths"""

import logging
from google.cloud import storage
from typing import Dict, Any
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)


class GCSUploader:
    """Upload crawl artifacts to Google Cloud Storage"""

    def __init__(self, config: Dict[str, Any]):
        gcp_config = config["gcp"]
        self.bucket_name = gcp_config["bucket_name"].replace("gs://", "")
        self.paths = config["gcs_paths"]

        # Initialize GCS client (uses application default credentials)
        self.storage_client = storage.Client(project=gcp_config["project_id"])
        self.bucket = self.storage_client.bucket(self.bucket_name)

        logger.info(f"GCS uploader initialized: {self.bucket_name}")

    def upload(self, local_docs: Path, local_chunks: Path, local_manifest: Path) -> Dict[str, str]:
        """
        Upload all artifacts to GCS.

        Returns:
            dict: GCS paths of uploaded files
        """
        logger.info("☁️  Uploading to GCS...")

        uploaded = {}

        # Upload docs
        docs_path = self.paths["raw_docs"]
        self._upload_file(local_docs, docs_path)
        uploaded["docs"] = f"gs://{self.bucket_name}/{docs_path}"

        # Upload chunks
        chunks_path = self.paths["chunks"]
        self._upload_file(local_chunks, chunks_path)
        uploaded["chunks"] = f"gs://{self.bucket_name}/{chunks_path}"

        # Upload manifest with timestamp
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        manifest_path = f"{self.paths['manifests']}crawl-manifest-{timestamp}.json"
        self._upload_file(local_manifest, manifest_path)
        uploaded["manifest"] = f"gs://{self.bucket_name}/{manifest_path}"

        logger.info("✅ Upload complete")
        return uploaded

    def _upload_file(self, local_path: Path, gcs_path: str) -> None:
        """Upload single file to GCS"""
        blob = self.bucket.blob(gcs_path)
        blob.upload_from_filename(str(local_path))
        logger.info(f"  ✓ {local_path.name} → gs://{self.bucket_name}/{gcs_path}")
