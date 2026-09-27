import time
from typing import Dict, Any, Optional

class CacheService:
    def __init__(self, default_ttl: int = 3600):
        self.default_ttl = default_ttl
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        normalized_key = key.strip().lower()
        if normalized_key in self._cache:
            entry = self._cache[normalized_key]
            if time.time() < entry["expires_at"]:
                return entry["data"]
            else:
                del self._cache[normalized_key]
        return None

    def set(self, key: str, data: Dict[str, Any], ttl: Optional[int] = None) -> None:
        normalized_key = key.strip().lower()
        expire_seconds = ttl if ttl is not None else self.default_ttl
        self._cache[normalized_key] = {
            "data": data,
            "cached_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "expires_at": time.time() + expire_seconds
        }

    def clear(self) -> None:
        self._cache.clear()

analysis_cache = CacheService(default_ttl=3600)
