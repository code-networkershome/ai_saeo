"""
Content Intelligence API Routes
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.services.content_engine import content_engine_service

router = APIRouter()


class ContentBriefRequest(BaseModel):
    topic: str
    target_keyword: str
    content_type: str = "blog_post"


class ContentCreateRequest(BaseModel):
    topic: str
    keyword: str
    word_count: int = 1500


class TitleRequest(BaseModel):
    keyword: str
    count: int = 5


class MetaRequest(BaseModel):
    keyword: str
    context: Optional[str] = None
    count: int = 5


class OutlineRequest(BaseModel):
    topic: str
    keyword: str


class SchemaRequest(BaseModel):
    schema_type: str
    data: Dict[str, Any] = {}


class RewriteRequest(BaseModel):
    text: str
    style: str = "improve"


class IdeasRequest(BaseModel):
    topic: str
    count: int = 10


class SummarizeRequest(BaseModel):
    content: str
    length: str = "medium"


@router.post("/brief")
async def generate_content_brief(request: ContentBriefRequest):
    """Generate comprehensive content brief"""
    result = await content_engine_service.generate_content_brief(
        request.topic, request.target_keyword, request.content_type
    )
    return {"success": True, "data": result}


@router.post("/create")
async def create_content(request: ContentCreateRequest):
    """Generate full content article"""
    result = await content_engine_service.create_content(
        request.topic, request.keyword, request.word_count
    )
    return {"success": True, "data": result}


@router.post("/titles")
async def generate_titles(request: TitleRequest):
    """Generate SEO-optimized title tags"""
    result = await content_engine_service.generate_titles(request.keyword, request.count)
    return {"success": True, "data": result}


@router.post("/meta")
async def generate_meta_descriptions(request: MetaRequest):
    """Generate meta descriptions"""
    result = await content_engine_service.generate_meta_descriptions(
        request.keyword, request.context, request.count
    )
    return {"success": True, "data": result}


@router.post("/outline")
async def create_outline(request: OutlineRequest):
    """Create content outline"""
    result = await content_engine_service.create_outline(request.topic, request.keyword)
    return {"success": True, "data": result}


@router.post("/schema")
async def generate_schema(request: SchemaRequest):
    """Generate JSON-LD schema markup"""
    result = await content_engine_service.generate_schema(request.schema_type, request.data)
    return {"success": True, "data": result}


@router.post("/rewrite")
async def rewrite_content(request: RewriteRequest):
    """Rewrite content with specified style"""
    result = await content_engine_service.rewrite_content(request.text, request.style)
    return {"success": True, "data": result}


@router.post("/ideas")
async def generate_ideas(request: IdeasRequest):
    """Generate article ideas for a topic"""
    result = await content_engine_service.generate_ideas(request.topic, request.count)
    return {"success": True, "data": result}


@router.post("/summarize")
async def summarize_content(request: SummarizeRequest):
    """Summarize content"""
    result = await content_engine_service.summarize_content(request.content, request.length)
    return {"success": True, "data": result}
