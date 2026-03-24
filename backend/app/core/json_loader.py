# @AI-HINT: JSON data loader utility for loading static data files (skills, categories, etc.)
from __future__ import annotations

import logging
import json
from pathlib import Path
from typing import Any
logger = logging.getLogger(__name__)

from .config import get_settings


def read_json(name: str) -> Any:
    settings = get_settings()
    base = Path(settings.json_data_dir)
    file_path = base / name
    with file_path.open("r", encoding="utf-8") as f:
        return json.load(f)
