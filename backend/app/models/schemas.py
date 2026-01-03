"""
Pydantic Schemas for API Request/Response Models
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ============== Common Models ==============

class StatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class BaseResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None


# ============== AI Visibility Models ==============

class BrandVisibilityRequest(BaseModel):
    brand_name: str = Field(..., description="Brand or company name to check")
    keywords: List[str] = Field(default=[], description="Related keywords to search")
    competitors: List[str] = Field(default=[], description="Competitor brands to compare")
    

class BrandVisibilityResponse(BaseResponse):
    brand: str
    visibility_score: float = Field(..., ge=0, le=100)
    mentions_count: int
    sentiment: str
    ai_platforms_checked: List[str]
    competitor_comparison: Optional[Dict[str, float]] = None
    recommendations: List[str]


class CitationRequest(BaseModel):
    domain: str = Field(..., description="Domain to check citations for")
    include_subdomains: bool = True


class CitationResponse(BaseResponse):
    domain: str
    total_citations: int
    citation_sources: List[Dict[str, Any]]
    authority_score: float


# ============== SEO Audit Models ==============

class SEOAuditRequest(BaseModel):
    url: str = Field(..., description="URL to audit")
    depth: int = Field(default=10, ge=1, le=100, description="Crawl depth")
    include_subpages: bool = True
    checks: List[str] = Field(
        default=["technical", "on_page", "performance", "schema"],
        description="Types of checks to perform"
    )


class SEOIssue(BaseModel):
    severity: str = Field(..., description="critical, warning, or info")
    category: str
    title: str
    description: str
    recommendation: str
    affected_urls: List[str] = []


class SEOAuditResponse(BaseResponse):
    url: str
    overall_score: float = Field(..., ge=0, le=100)
    issues: List[SEOIssue]
    summary: Dict[str, Any]
    pages_crawled: int
    audit_duration_seconds: float


class PageAnalysisRequest(BaseModel):
    url: str = Field(..., description="URL to analyze")


class PageAnalysisResponse(BaseResponse):
    url: str
    title: Optional[str]
    meta_description: Optional[str]
    h1_tags: List[str]
    word_count: int
    images_without_alt: int
    internal_links: int
    external_links: int
    schema_types: List[str]
    load_time_ms: Optional[float]
    mobile_friendly: bool
    recommendations: List[str]


# ============== Content Models ==============

class ContentBriefRequest(BaseModel):
    topic: str = Field(..., description="Main topic for content")
    target_keyword: str = Field(..., description="Primary keyword to target")
    content_type: str = Field(default="blog_post", description="Type: blog_post, landing_page, product_page")
    word_count_target: int = Field(default=1500, ge=300, le=10000)
    tone: str = Field(default="professional", description="Tone: professional, casual, technical, friendly")
    target_audience: Optional[str] = None


class ContentBriefResponse(BaseResponse):
    topic: str
    target_keyword: str
    suggested_title: str
    meta_description: str
    outline: List[Dict[str, Any]]
    semantic_keywords: List[str]
    questions_to_answer: List[str]
    competitor_insights: List[str]
    word_count_target: int
    readability_target: str


class ContentCreateRequest(BaseModel):
    topic: str = Field(..., description="Topic to write about")
    keyword: str = Field(..., description="Primary keyword")
    outline: Optional[List[str]] = None
    word_count: int = Field(default=1500, ge=300, le=5000)
    tone: str = Field(default="professional")
    include_faq: bool = True
    include_meta: bool = True


class ContentCreateResponse(BaseResponse):
    content: str
    title: str
    meta_description: str
    word_count: int
    readability_score: float
    keyword_density: float
    faq_section: Optional[List[Dict[str, str]]] = None


class ContentOptimizeRequest(BaseModel):
    content: str = Field(..., description="Content to optimize")
    target_keyword: str
    optimization_goals: List[str] = Field(
        default=["readability", "seo", "engagement"],
        description="Optimization goals"
    )


class ContentOptimizeResponse(BaseResponse):
    optimized_content: str
    changes_made: List[str]
    score_before: float
    score_after: float
    suggestions: List[str]


class RewriteRequest(BaseModel):
    text: str = Field(..., description="Text to rewrite")
    style: str = Field(default="improve", description="Style: improve, simplify, formal, casual, expand, condense")


class RewriteResponse(BaseResponse):
    original: str
    rewritten: str
    improvements: List[str]


class MetaGeneratorRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    url: Optional[str] = None
    keyword: str = Field(..., description="Target keyword")
    count: int = Field(default=5, ge=1, le=10, description="Number of variations")


class MetaGeneratorResponse(BaseResponse):
    title_suggestions: List[Dict[str, Any]]
    meta_description_suggestions: List[Dict[str, Any]]
    keyword: str


class SchemaGeneratorRequest(BaseModel):
    url: Optional[str] = None
    content: Optional[str] = None
    schema_type: str = Field(
        default="Article",
        description="Schema type: Article, Product, LocalBusiness, FAQ, HowTo, etc."
    )
    additional_info: Optional[Dict[str, Any]] = None


class SchemaGeneratorResponse(BaseResponse):
    schema_type: str
    json_ld: Dict[str, Any]
    html_snippet: str
    validation_status: str


# ============== Keyword Models ==============

class KeywordDiscoverRequest(BaseModel):
    seed_keyword: str = Field(..., description="Seed keyword to expand")
    country: str = Field(default="us", description="Target country code")
    language: str = Field(default="en", description="Target language")
    limit: int = Field(default=50, ge=10, le=200)


class KeywordData(BaseModel):
    keyword: str
    search_volume: Optional[int] = None
    difficulty: Optional[float] = None
    cpc: Optional[float] = None
    trend: Optional[str] = None
    intent: Optional[str] = None


class KeywordDiscoverResponse(BaseResponse):
    seed_keyword: str
    keywords: List[KeywordData]
    total_found: int
    categories: Dict[str, List[str]]


class KeywordAnalyzeRequest(BaseModel):
    keywords: List[str] = Field(..., min_length=1, max_length=100)
    country: str = Field(default="us")


class KeywordAnalyzeResponse(BaseResponse):
    results: List[KeywordData]
    summary: Dict[str, Any]


class SERPAnalysisRequest(BaseModel):
    keyword: str = Field(..., description="Keyword to analyze SERP for")
    country: str = Field(default="us")
    device: str = Field(default="desktop", description="desktop or mobile")


class SERPResult(BaseModel):
    position: int
    url: str
    title: str
    description: Optional[str]
    domain: str
    features: List[str] = []


class SERPAnalysisResponse(BaseResponse):
    keyword: str
    serp_features: List[str]
    organic_results: List[SERPResult]
    difficulty_estimate: float
    opportunity_score: float


# ============== Competitive Models ==============

class CompetitorAnalysisRequest(BaseModel):
    domain: str = Field(..., description="Your domain")
    competitors: List[str] = Field(..., min_length=1, max_length=10)
    analysis_type: List[str] = Field(
        default=["overview", "keywords", "content", "backlinks"],
        description="Types of analysis"
    )


class DomainMetrics(BaseModel):
    domain: str
    domain_authority: Optional[float] = None
    organic_traffic_estimate: Optional[int] = None
    organic_keywords: Optional[int] = None
    backlinks_count: Optional[int] = None
    referring_domains: Optional[int] = None


class CompetitorAnalysisResponse(BaseResponse):
    your_domain: DomainMetrics
    competitors: List[DomainMetrics]
    keyword_gaps: List[KeywordData]
    content_opportunities: List[str]
    recommendations: List[str]


class ContentGapRequest(BaseModel):
    your_domain: str
    competitor_domains: List[str] = Field(..., min_length=1, max_length=5)


class ContentGapResponse(BaseResponse):
    gaps: List[Dict[str, Any]]
    opportunities: List[str]
    priority_keywords: List[KeywordData]


# ============== Agent Models ==============

class AgentTaskRequest(BaseModel):
    task_type: str = Field(..., description="Type of agent task")
    parameters: Dict[str, Any] = Field(default={})
    priority: str = Field(default="normal", description="low, normal, high")


class AgentTaskResponse(BaseResponse):
    task_id: str
    task_type: str
    status: StatusEnum
    estimated_completion: Optional[datetime] = None


class AgentStatusResponse(BaseResponse):
    task_id: str
    status: StatusEnum
    progress: float = Field(..., ge=0, le=100)
    results: Optional[Dict[str, Any]] = None
    critic_score: Optional[float] = None # New field
    critic_feedback: Optional[str] = None # New field
    logs: List[str] = []


# ============== Research Models ==============

class DomainResearchRequest(BaseModel):
    domain: str = Field(..., description="Domain to research")


class DomainResearchResponse(BaseResponse):
    domain: str
    domain_authority: float
    trust_score: float
    spam_score: float
    backlinks_estimate: int
    referring_domains: int
    domain_age_years: Optional[float] = None
    ssl_valid: bool
    technologies: List[str] = []


class KeywordResearchRequest(BaseModel):
    keyword: str = Field(..., description="Keyword to research")
    include_related: bool = True
    include_questions: bool = True


class KeywordResearchResponse(BaseResponse):
    keyword: str
    search_volume: int
    difficulty: float
    cpc: float
    competition: str
    trend_direction: str
    related_keywords: List[KeywordData] = []
    questions: List[str] = []
    long_tail_variations: List[str] = []
