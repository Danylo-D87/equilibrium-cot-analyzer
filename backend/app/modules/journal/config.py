"""
Journal module configuration.
"""

# Max images per trade
MAX_IMAGES_PER_TRADE: int = 10

# Allowed image MIME types
ALLOWED_IMAGE_TYPES: set[str] = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
}

# ── Image compression settings ──
# All uploads are auto-compressed to WebP.
# Original is resized to fit within IMAGE_MAX_DIMENSION (preserving aspect ratio).
# A thumbnail is generated alongside (convention: {name}_thumb.webp).
IMAGE_MAX_DIMENSION: int = 1920        # px — longest side of the "full" image
IMAGE_QUALITY: int = 85                # WebP quality (1-100); 85 ≈ visually lossless
THUMBNAIL_MAX_DIMENSION: int = 400     # px — longest side of thumbnail
THUMBNAIL_QUALITY: int = 75            # WebP quality for thumbnails

# BTC cache file name (relative to backend/data/)
BTC_CACHE_FILENAME: str = "btc_cache.csv"
