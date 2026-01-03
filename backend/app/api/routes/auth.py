from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
import logging
from app.services.google_metrics import google_metrics

router = APIRouter(prefix="/auth/google", tags=["auth"])
logger = logging.getLogger(__name__)

from app.core.config import settings

@router.get("/login")
async def google_login():
    """Initiate Google OAuth login"""
    auth_url = google_metrics.get_auth_url(settings.GOOGLE_REDIRECT_URI)
    if not auth_url:
        raise HTTPException(status_code=400, detail="Google OAuth not configured")
    return RedirectResponse(auth_url)

@router.get("/status")
async def google_status():
    """Check if Google OAuth is connected"""
    return {
        "is_connected": google_metrics.credentials is not None,
        "is_configured": google_metrics.is_configured
    }

@router.get("/callback")
async def google_callback(code: str, state: str = None):
    """Handle Google OAuth callback"""
    try:
        success = await google_metrics.handle_callback(code, settings.GOOGLE_REDIRECT_URI)
        if success:
            return {"status": "success", "message": "Google account connected successfully! You can now access real SEO data."}
        return {"status": "error", "message": "Failed to connect Google account."}
    except Exception as e:
        logger.error(f"Error in Google callback: {e}")
        raise HTTPException(status_code=500, detail=str(e))
