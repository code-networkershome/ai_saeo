"""
SEO Audit API Routes
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from app.services.seo_auditor import seo_auditor_service

router = APIRouter()


class AuditRequest(BaseModel):
    url: str
    depth: int = 10
    checks: List[str] = ["technical", "on_page", "performance", "schema"]


class PageAnalysisRequest(BaseModel):
    url: str


class ExplainIssueRequest(BaseModel):
    url: str
    issue: dict


@router.post("/full")
async def full_seo_audit(request: AuditRequest):
    """Perform comprehensive SEO audit"""
    result = await seo_auditor_service.full_audit(request.url, request.depth)
    return {"success": True, "data": result}


@router.post("/technical")
async def technical_audit(request: PageAnalysisRequest):
    """Technical SEO audit only"""
    crawl_data = await seo_auditor_service._basic_crawl(request.url)
    result = await seo_auditor_service._check_technical_seo(request.url, crawl_data)
    return {"success": True, "data": result}


@router.post("/on-page")
async def on_page_audit(request: PageAnalysisRequest):
    """On-page SEO analysis"""
    crawl_data = await seo_auditor_service._basic_crawl(request.url)
    result = await seo_auditor_service._check_on_page_seo(request.url, crawl_data)
    return {"success": True, "data": result}


@router.post("/page-analysis")
async def analyze_page(request: PageAnalysisRequest):
    """Single page SEO analysis"""
    result = await seo_auditor_service.analyze_page(request.url)
    return {"success": True, "data": result}


@router.post("/performance")
async def performance_check(request: PageAnalysisRequest):
    """Performance/Core Web Vitals check"""
    result = await seo_auditor_service._check_performance(request.url)
    return {"success": True, "data": result}


@router.post("/schema")
async def schema_validation(request: PageAnalysisRequest):
    """Validate schema markup"""
    crawl_data = await seo_auditor_service._basic_crawl(request.url)
    result = await seo_auditor_service._validate_schema(request.url, crawl_data)
    return {"success": True, "data": result}


@router.post("/explain")
async def explain_issue(request: ExplainIssueRequest):
    """Use AI to explain an SEO issue in detail"""
    result = await seo_auditor_service.explain_issue(request.issue, request.url)
    return {"success": True, "data": result}
