"""
Image upload / serve / delete service for journal trades.
===========================================================
Per-user storage: uploads/images/{user_id}/{uuid}.webp

Every upload is auto-compressed:
- Resized to fit within 1920 px (longest side, aspect ratio preserved)
- Converted to WebP (quality 85) — visually identical, ~5-10× smaller
- A 400 px thumbnail is generated alongside  (*_thumb.webp*)
"""

from __future__ import annotations

import io
import logging
import uuid
from pathlib import Path

import aiofiles
from PIL import Image, ImageOps

from app.core.config import settings
from app.modules.journal.config import (
    ALLOWED_IMAGE_TYPES,
    IMAGE_MAX_DIMENSION,
    IMAGE_QUALITY,
    MAX_IMAGES_PER_TRADE,
    THUMBNAIL_MAX_DIMENSION,
    THUMBNAIL_QUALITY,
)

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────────────────────

def _user_images_dir(user_id: uuid.UUID) -> Path:
    """Per-user images directory."""
    path = settings.upload_dir / "images" / str(user_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _compress_image(
    raw_bytes: bytes,
    max_dim: int,
    quality: int,
) -> bytes:
    """
    Open image bytes → resize if needed → convert to WebP.

    Returns the compressed WebP bytes.
    """
    img = Image.open(io.BytesIO(raw_bytes))

    # Preserve EXIF orientation
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # Convert to RGB/RGBA (WebP doesn't handle palette/CMYK modes well)
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Resize preserving aspect ratio (only downscale, never upscale)
    w, h = img.size
    if max(w, h) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=quality, method=4)
    return buf.getvalue()


# ──────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────

async def save_image(
    user_id: uuid.UUID,
    original_filename: str,
    content: bytes,
    mime_type: str | None = None,
) -> tuple[str, str, int]:
    """
    Compress and save image bytes to per-user storage.

    Steps:
    1. Validate MIME type and raw size.
    2. Compress to WebP (max 1920 px, quality 85).
    3. Generate a thumbnail (400 px, quality 75).
    4. Save both files.

    Returns:
        (generated_filename, storage_path_relative, compressed_file_size)
    """
    # Validate MIME
    if mime_type and mime_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError(f"Unsupported image type: {mime_type}")

    # Validate raw upload size (before compression)
    raw_size = len(content)
    if raw_size > settings.max_image_size:
        max_mb = settings.max_image_size / (1024 * 1024)
        raise ValueError(f"Image too large. Max {max_mb:.0f} MB")

    # ── Compress main image ──
    compressed = _compress_image(content, IMAGE_MAX_DIMENSION, IMAGE_QUALITY)

    # ── Compress thumbnail ──
    thumb = _compress_image(content, THUMBNAIL_MAX_DIMENSION, THUMBNAIL_QUALITY)

    # ── Generate filenames ──
    base_name = uuid.uuid4().hex
    gen_name = f"{base_name}.webp"
    thumb_name = f"{base_name}_thumb.webp"

    user_dir = _user_images_dir(user_id)
    main_path = user_dir / gen_name
    thumb_path = user_dir / thumb_name

    # ── Write both files ──
    async with aiofiles.open(main_path, "wb") as f:
        await f.write(compressed)
    async with aiofiles.open(thumb_path, "wb") as f:
        await f.write(thumb)

    # Relative storage path: {user_id}/{filename}
    rel_path = f"{user_id}/{gen_name}"
    file_size = len(compressed)

    saved_pct = (1 - file_size / raw_size) * 100 if raw_size > 0 else 0
    logger.info(
        "Saved image %s (%d→%d bytes, %.0f%% saved) + thumb %s (%d bytes) for user %s",
        gen_name, raw_size, file_size, saved_pct,
        thumb_name, len(thumb), user_id,
    )
    return gen_name, rel_path, file_size


def get_image_full_path(storage_path: str) -> Path:
    """Resolve a relative storage path to absolute file path."""
    return settings.upload_dir / "images" / storage_path


def get_thumbnail_path(storage_path: str) -> Path:
    """
    Derive thumbnail path from the main image storage path.

    Convention: ``{uuid}.webp`` → ``{uuid}_thumb.webp``
    """
    main = get_image_full_path(storage_path)
    thumb = main.with_name(main.stem + "_thumb.webp")
    return thumb


def delete_image_file(storage_path: str) -> bool:
    """Delete an image file + its thumbnail from disk. Returns True if main deleted."""
    full_path = get_image_full_path(storage_path)
    deleted = False
    if full_path.exists():
        full_path.unlink()
        deleted = True
        logger.info("Deleted image file: %s", storage_path)
    else:
        logger.warning("Image file not found for deletion: %s", storage_path)

    # Also delete thumbnail
    thumb = get_thumbnail_path(storage_path)
    if thumb.exists():
        thumb.unlink()
        logger.debug("Deleted thumbnail: %s", thumb.name)

    return deleted


def delete_user_images_dir(user_id: uuid.UUID) -> None:
    """Remove entire per-user images directory (used on full clear)."""
    import shutil
    user_dir = settings.upload_dir / "images" / str(user_id)
    if user_dir.exists():
        shutil.rmtree(user_dir)
        logger.info("Deleted images directory for user %s", user_id)
