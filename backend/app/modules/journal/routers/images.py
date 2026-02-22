"""Journal trade image endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.models import User
from app.modules.journal import storage
from app.modules.journal.config import MAX_IMAGES_PER_TRADE
from app.modules.journal.image_service import (
    delete_image_file,
    get_image_full_path,
    get_thumbnail_path,
    save_image,
)
from app.modules.journal.routers._deps import journal_perm, journal_perm_or_token
from app.modules.journal.schemas import (
    ImageCaptionUpdate,
    ImageReorderRequest,
    MessageResponse,
    TradeImageResponse,
)

router = APIRouter(tags=["Journal"])


@router.post("/trades/{trade_id}/images", response_model=TradeImageResponse, status_code=201)
async def upload_image(
    trade_id: uuid.UUID,
    file: UploadFile = File(...),
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Upload an image for a trade."""
    trade = await storage.get_trade(db, user.id, trade_id)
    if trade is None:
        raise HTTPException(404, "Trade not found")

    existing = await storage.get_trade_images(db, trade_id, user.id)
    if len(existing) >= MAX_IMAGES_PER_TRADE:
        raise HTTPException(400, f"Maximum {MAX_IMAGES_PER_TRADE} images per trade")

    content = await file.read()
    try:
        gen_name, rel_path, file_size = await save_image(
            user_id=user.id,
            original_filename=file.filename or "image.png",
            content=content,
            mime_type=file.content_type,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

    image = await storage.add_trade_image(
        db,
        user_id=user.id,
        trade_id=trade_id,
        filename=gen_name,
        storage_path=rel_path,
        file_size=file_size,
        mime_type="image/webp",
    )
    return TradeImageResponse.model_validate(image)


@router.get("/images/{image_id}")
async def serve_image(
    image_id: uuid.UUID,
    user: User = Depends(journal_perm_or_token),
    db: AsyncSession = Depends(get_async_session),
):
    """Serve an image file."""
    image = await storage.get_image_by_id(db, image_id, user.id)
    if image is None:
        raise HTTPException(404, "Image not found")

    full_path = get_image_full_path(image.storage_path)
    if not full_path.exists():
        raise HTTPException(404, "Image file not found on disk")

    return FileResponse(path=str(full_path), media_type="image/webp", filename=image.filename)


@router.get("/images/{image_id}/thumbnail")
async def serve_thumbnail(
    image_id: uuid.UUID,
    user: User = Depends(journal_perm_or_token),
    db: AsyncSession = Depends(get_async_session),
):
    """Serve a thumbnail of an image."""
    image = await storage.get_image_by_id(db, image_id, user.id)
    if image is None:
        raise HTTPException(404, "Image not found")

    thumb_path = get_thumbnail_path(image.storage_path)
    if not thumb_path.exists():
        full_path = get_image_full_path(image.storage_path)
        if not full_path.exists():
            raise HTTPException(404, "Image file not found on disk")
        return FileResponse(path=str(full_path), media_type="image/webp", filename=image.filename)

    return FileResponse(
        path=str(thumb_path),
        media_type="image/webp",
        filename=f"thumb_{image.filename}",
    )


@router.delete("/images/{image_id}", response_model=MessageResponse)
async def delete_image(
    image_id: uuid.UUID,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Delete a single image."""
    image = await storage.delete_image(db, image_id, user.id)
    if image is None:
        raise HTTPException(404, "Image not found")
    delete_image_file(image.storage_path)
    return MessageResponse(message="Image deleted")


@router.delete("/trades/{trade_id}/images", response_model=MessageResponse)
async def delete_all_images(
    trade_id: uuid.UUID,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Delete all images for a trade."""
    images = await storage.delete_all_images_for_trade(db, trade_id, user.id)
    for img in images:
        delete_image_file(img.storage_path)
    return MessageResponse(message=f"{len(images)} images deleted")


@router.put("/trades/{trade_id}/images/reorder", response_model=MessageResponse)
async def reorder_images(
    trade_id: uuid.UUID,
    body: ImageReorderRequest,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Reorder images for a trade."""
    await storage.reorder_images(db, trade_id, user.id, body.image_ids)
    return MessageResponse(message="Images reordered")


@router.patch("/images/{image_id}/caption", response_model=TradeImageResponse)
async def update_image_caption(
    image_id: uuid.UUID,
    body: ImageCaptionUpdate,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Update caption for an image."""
    image = await storage.update_image_caption(db, image_id, user.id, body.caption)
    if image is None:
        raise HTTPException(404, "Image not found")
    return TradeImageResponse.model_validate(image)
