"""
AI Visibility API Routes
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from app.services.ai_visibility import ai_visibility_service

router = APIRouter()


class BrandCheckRequest(BaseModel):
    brand_name: str
    keywords: List[str] = []
    industry: Optional[str] = None


class CompetitorCompareRequest(BaseModel):
    brand_name: str
    competitors: List[str]
    keywords: List[str] = []


class CitationRequest(BaseModel):
    domain: str


class ExecutePlaybookRequest(BaseModel):
    brand_name: str
    playbook_items: List[dict]


@router.post("/check")
async def check_brand_visibility(request: BrandCheckRequest):
    """Check brand visibility across AI platforms"""
    result = await ai_visibility_service.check_brand_visibility(
        request.brand_name,
        request.keywords
    )
    return {"success": True, "data": result}


@router.post("/compare")
async def compare_visibility(request: CompetitorCompareRequest):
    """Compare brand visibility with competitors"""
    result = await ai_visibility_service.compare_with_competitors(
        request.brand_name,
        request.competitors
    )
    return {"success": True, "data": result}


@router.post("/citations")
async def track_citations(request: CitationRequest):
    """Track citations to a domain"""
    result = await ai_visibility_service.track_citations(request.domain)
    return {"success": True, "data": result}


@router.post("/execute")
async def execute_playbook(request: ExecutePlaybookRequest):
    """Execute AEO playbook items"""
    result = await ai_visibility_service.execute_playbook(
        request.brand_name,
        request.playbook_items
    )
    return {"success": True, "data": result}


@router.get("/platforms")
async def get_ai_platforms():
    """Get list of AI platforms we track"""
    return {
        "success": True,
        "platforms": ai_visibility_service.ai_platforms
    }
