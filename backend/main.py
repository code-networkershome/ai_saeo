"""
Ultimate SEO/AEO/GEO Marketing Platform API
Production-grade backend for comprehensive marketing intelligence
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging

from app.core.config import settings
from app.api.routes import (
    ai_visibility,
    seo_audit,
    content,
    keywords,
    competitive,
    agents,
    research,
    edge,
    analytics,
    auth
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("🚀 Starting SEO Intelligence Platform...")
    logger.info(f"📊 Version: {settings.APP_VERSION}")
    yield
    logger.info("👋 Shutting down SEO Intelligence Platform...")


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## 🚀 Ultimate SEO/AEO/GEO Marketing Platform
    
    A production-grade API for comprehensive marketing intelligence that competes with 
    SEMrush, Ahrefs, and other industry leaders.
    
    ### Features:
    - **AI Visibility Engine** - Track your brand's visibility in AI tools like ChatGPT
    - **SEO Auditor** - Technical and on-page SEO analysis
    - **Content Intelligence** - AI-powered content creation and optimization
    - **Keyword Research** - Comprehensive keyword analysis and discovery
    - **Competitive Intelligence** - Competitor analysis and comparison
    - **Autonomous Agents** - Automated SEO workflows and monitoring
    """,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


# Include routers
app.include_router(
    ai_visibility.router,
    prefix=f"{settings.API_PREFIX}/ai-visibility",
    tags=["🤖 AI Visibility"]
)

app.include_router(
    seo_audit.router,
    prefix=f"{settings.API_PREFIX}/audit",
    tags=["🔍 SEO Audit"]
)

app.include_router(
    content.router,
    prefix=f"{settings.API_PREFIX}/content",
    tags=["✍️ Content Intelligence"]
)

app.include_router(
    keywords.router,
    prefix=f"{settings.API_PREFIX}/keywords",
    tags=["🔑 Keyword Research"]
)

app.include_router(
    competitive.router,
    prefix=f"{settings.API_PREFIX}/competitive",
    tags=["📊 Competitive Intelligence"]
)

app.include_router(
    agents.router,
    prefix=f"{settings.API_PREFIX}/agents",
    tags=["🤖 Autonomous Agents"]
)

app.include_router(
    research.router,
    prefix=f"{settings.API_PREFIX}/research",
    tags=["🔬 Research Tools"]
)

app.include_router(
    edge.router,
    prefix=f"{settings.API_PREFIX}/edge",
    tags=["⚡ Edge SEO"]
)

app.include_router(
    analytics.router,
    prefix=f"{settings.API_PREFIX}/analytics",
    tags=["📊 Analytics Dashboard"]
)

app.include_router(
    auth.router,
    prefix=f"{settings.API_PREFIX}",
    tags=["🔑 Authentication"]
)


# Health check endpoints
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
        "features": [
            "AI Visibility Engine",
            "SEO Auditor",
            "Content Intelligence",
            "Keyword Research",
            "Competitive Intelligence",
            "Autonomous Agents"
        ]
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "timestamp": time.time()
    }


@app.get("/api/v1/status", tags=["Health"])
async def api_status():
    """API status with service availability"""
    return {
        "api_version": "v1",
        "status": "operational",
        "services": {
            "ai_visibility": "available",
            "seo_audit": "available",
            "content_intelligence": "available",
            "keyword_research": "available",
            "competitive_intel": "available",
            "agents": "available"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
