import json
import os
from typing import Dict, Any

class MemoryInterface:
    def __init__(self, memory_path: str):
        self.memory_path = memory_path
        self.data = self._load()

    def _load(self) -> Dict[str, Any]:
        if os.path.exists(self.memory_path):
            try:
                with open(self.memory_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def save(self):
        os.makedirs(os.path.dirname(self.memory_path), exist_ok=True)
        with open(self.memory_path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)

    def get(self, key: str, default=None):
        return self.data.get(key, default)

    def set(self, key: str, value: Any):
        self.data[key] = value
        self.save()
