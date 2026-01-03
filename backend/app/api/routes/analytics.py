"""
Analytics API Routes
Provides comprehensive domain analytics with AI-powered insights
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

from app.services.analytics import AnalyticsService

logger = logging.getLogger(__name__)
router = APIRouter()

analytics_service = AnalyticsService()


class AnalyticsRequest(BaseModel):
    domain: str


class QuickMetricsRequest(BaseModel):
    domain: str
    metrics: Optional[list] = None  # Specific metrics to fetch


@router.post("/full")
async def get_full_analytics(request: AnalyticsRequest):
    """
    Get comprehensive analytics for a domain.
    Orchestrates all agents: SEO Auditor, AI Visibility, Competitor Intel, Keyword Engine
    Returns structured data optimized for dashboard charts
    """
    try:
        result = await analytics_service.get_domain_analytics(request.domain)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Analytics failed for {request.domain}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quick")
async def get_quick_metrics(request: QuickMetricsRequest):
    """
    Get quick metrics for a domain (faster, subset of data)
    """
    try:
        # For quick metrics, we'll just get the summary without full analysis
        result = await analytics_service.get_domain_analytics(request.domain)
        
        return {
            "success": True,
            "data": {
                "domain": result.get("domain"),
                "summary_metrics": result.get("summary_metrics"),
                "ai_visibility": result.get("ai_visibility"),
                "ai_insights": result.get("ai_insights")
            }
        }
    except Exception as e:
        logger.error(f"Quick metrics failed for {request.domain}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def analytics_health():
    """Health check for analytics service"""
    return {"status": "healthy", "service": "analytics"}
