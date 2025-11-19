"""
Configuration loader for ADK Docs Crawler

Loads config.yaml and substitutes environment variables.
"""

import os
import yaml
import logging
from pathlib import Path
from typing import Dict, Any
from string import Template

logger = logging.getLogger(__name__)


def load_config(config_path: str | None = None) -> Dict[str, Any]:
    """
    Load configuration from YAML file with environment variable substitution.

    Args:
        config_path: Path to config.yaml (defaults to same directory as this file)

    Returns:
        dict: Configuration with environment variables substituted

    Raises:
        FileNotFoundError: If config file doesn't exist
        ValueError: If required environment variables are missing
    """
    if config_path is None:
        # Default to config.yaml in same directory as this file
        config_path = Path(__file__).parent / "config.yaml"
    else:
        config_path = Path(config_path)

    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    logger.info(f"Loading config from: {config_path}")

    # Read YAML
    with open(config_path, 'r') as f:
        config_str = f.read()

    # Substitute environment variables
    template = Template(config_str)
    substituted = template.safe_substitute(os.environ)

    # Parse YAML
    config = yaml.safe_load(substituted)

    # Validate required GCP env vars
    _validate_gcp_config(config)

    # Create output directories
    _ensure_output_dirs(config)

    logger.info("Configuration loaded successfully")

    return config


def _validate_gcp_config(config: Dict[str, Any]) -> None:
    """
    Validate that required GCP configuration is present.

    Raises:
        ValueError: If required config is missing
    """
    gcp = config.get("gcp", {})

    # Check for unsubstituted variables (still have ${...} format)
    for key in ["project_id", "bucket_name"]:
        value = gcp.get(key, "")
        if value.startswith("${"):
            raise ValueError(
                f"Missing environment variable for gcp.{key}. "
                f"Please set {value[2:-1]} environment variable."
            )

    # Validate not empty
    if not gcp.get("project_id"):
        raise ValueError("gcp.project_id cannot be empty. Set GCP_PROJECT_ID environment variable.")

    if not gcp.get("bucket_name"):
        raise ValueError("gcp.bucket_name cannot be empty. Set HUSTLE_DOCS_BUCKET environment variable.")

    logger.info(f"GCP config validated: project={gcp['project_id']}, bucket={gcp['bucket_name']}")


def _ensure_output_dirs(config: Dict[str, Any]) -> None:
    """
    Create output directories if they don't exist.
    """
    output = config.get("output", {})
    tmp_dir = output.get("tmp_dir", "tmp/adk_crawler")

    Path(tmp_dir).mkdir(parents=True, exist_ok=True)

    # Create log directory if logging to file
    logging_config = config.get("logging", {})
    if logging_config.get("log_to_file"):
        log_file = Path(logging_config.get("log_file", "tmp/adk_docs_crawler.log"))
        log_file.parent.mkdir(parents=True, exist_ok=True)

    logger.debug(f"Output directories created: {tmp_dir}")


def get_env_template() -> str:
    """
    Return a template .env file for required environment variables.

    Returns:
        str: .env template content
    """
    return """# ADK Docs Crawler Environment Variables for Hustle

# GCP Configuration
GCP_PROJECT_ID=hustleapp-production
HUSTLE_DOCS_BUCKET=gs://hustle-adk-docs
CRAWLER_SA_EMAIL=adk-crawler@hustleapp-production.iam.gserviceaccount.com

# Google Application Default Credentials
# Run: gcloud auth application-default login
# Or set: GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
"""


if __name__ == "__main__":
    # Test config loading
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "template":
        print(get_env_template())
    else:
        try:
            config = load_config()
            print("✅ Configuration loaded successfully")
            print(f"   Project: {config['gcp']['project_id']}")
            print(f"   Bucket: {config['gcp']['bucket_name']}")
            print(f"   Base URL: {config['crawler']['base_url']}")
        except Exception as e:
            print(f"❌ Configuration error: {e}")
            print("\nTo generate .env template:")
            print("  python -m tools.adk_docs_crawler.config template")
            sys.exit(1)
