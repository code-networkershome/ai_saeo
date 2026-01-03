"""
Competitive Intelligence API Routes
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from app.services.competitive_intel import competitive_intel_service

router = APIRouter()


class CompetitorAnalysisRequest(BaseModel):
    domain: str


class CompareDomainsRequest(BaseModel):
    your_domain: str
    competitors: List[str]


class ContentGapRequest(BaseModel):
    your_domain: str
    competitor_domains: List[str]


class TrafficRequest(BaseModel):
    domain: str


class BacklinkRequest(BaseModel):
    domain: str


@router.post("/analyze")
async def analyze_competitor(request: CompetitorAnalysisRequest):
    """Comprehensive competitor analysis"""
    result = await competitive_intel_service.analyze_competitor(request.domain)
    return {"success": True, "data": result}


@router.post("/compare")
async def compare_domains(request: CompareDomainsRequest):
    """Compare your domain with competitors"""
    result = await competitive_intel_service.compare_domains(
        request.your_domain, request.competitors
    )
    return {"success": True, "data": result}


@router.post("/content-gaps")
async def find_content_gaps(request: ContentGapRequest):
    """Find content gaps between you and competitors"""
    result = await competitive_intel_service.find_content_gaps(
        request.your_domain, request.competitor_domains
    )
    return {"success": True, "data": result}


@router.post("/traffic")
async def estimate_traffic(request: TrafficRequest):
    """Estimate domain traffic"""
    result = await competitive_intel_service.estimate_traffic(request.domain)
    return {"success": True, "data": result}


@router.post("/backlinks")
async def analyze_backlinks(request: BacklinkRequest):
    """Analyze backlink profile"""
    result = await competitive_intel_service.backlink_analysis(request.domain)
    return {"success": True, "data": result}
