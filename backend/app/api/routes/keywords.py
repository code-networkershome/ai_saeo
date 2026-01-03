"""
Keyword Research API Routes
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from app.services.keyword_engine import keyword_engine_service

router = APIRouter()


class DiscoverRequest(BaseModel):
    seed_keyword: str
    limit: int = 50


class AnalyzeRequest(BaseModel):
    keyword: str


class LongTailRequest(BaseModel):
    keyword: str
    count: int = 30


class QuestionsRequest(BaseModel):
    keyword: str
    count: int = 20


class SERPRequest(BaseModel):
    keyword: str


class ClusterRequest(BaseModel):
    keywords: List[str]


@router.post("/discover")
async def discover_keywords(request: DiscoverRequest):
    """Discover related keywords from seed"""
    result = await keyword_engine_service.discover_keywords(
        request.seed_keyword, request.limit
    )
    return {"success": True, "data": result}


@router.post("/analyze")
async def analyze_keyword(request: AnalyzeRequest):
    """Detailed keyword analysis"""
    result = await keyword_engine_service.analyze_keyword(request.keyword)
    return {"success": True, "data": result}


@router.post("/long-tail")
async def find_long_tail(request: LongTailRequest):
    """Find long-tail keyword variations"""
    result = await keyword_engine_service.find_long_tail(request.keyword, request.count)
    return {"success": True, "data": result}


@router.post("/questions")
async def find_questions(request: QuestionsRequest):
    """Find question-based keywords"""
    result = await keyword_engine_service.find_questions(request.keyword, request.count)
    return {"success": True, "data": result}


@router.post("/serp")
async def analyze_serp(request: SERPRequest):
    """Analyze SERP for keyword"""
    result = await keyword_engine_service.analyze_serp(request.keyword)
    return {"success": True, "data": result}


@router.post("/cluster")
async def cluster_keywords(request: ClusterRequest):
    """Cluster keywords by topic/intent"""
    result = await keyword_engine_service.cluster_keywords(request.keywords)
    return {"success": True, "data": result}
