"""
Autonomous Agents API Routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.agents.orchestrator import agent_orchestrator, AgentType

router = APIRouter()


class SEOAuditAgentRequest(BaseModel):
    url: str
    options: Dict[str, Any] = {}


class ContentAgentRequest(BaseModel):
    topic: str
    keyword: str
    options: Dict[str, Any] = {}


class KeywordAgentRequest(BaseModel):
    seed_keyword: str
    options: Dict[str, Any] = {}


class CompetitiveAgentRequest(BaseModel):
    your_domain: str
    competitors: List[str]
    options: Dict[str, Any] = {}


class FullStrategyRequest(BaseModel):
    domain: str
    target_keywords: List[str] = []
    competitors: List[str] = []


@router.post("/seo-audit")
async def run_seo_audit_agent(request: SEOAuditAgentRequest):
    """Run autonomous SEO audit agent"""
    task_id = await agent_orchestrator.start_task(
        AgentType.SEO_AUDIT,
        {"url": request.url, "options": request.options}
    )
    return {"success": True, "task_id": task_id, "message": "SEO audit agent started"}


@router.post("/content-workflow")
async def run_content_agent(request: ContentAgentRequest):
    """Run autonomous content creation agent"""
    task_id = await agent_orchestrator.start_task(
        AgentType.CONTENT_CREATION,
        {"topic": request.topic, "keyword": request.keyword, "options": request.options}
    )
    return {"success": True, "task_id": task_id, "message": "Content creation agent started"}


@router.post("/keyword-research")
async def run_keyword_agent(request: KeywordAgentRequest):
    """Run autonomous keyword research agent"""
    task_id = await agent_orchestrator.start_task(
        AgentType.KEYWORD_RESEARCH,
        {"seed_keyword": request.seed_keyword, "options": request.options}
    )
    return {"success": True, "task_id": task_id, "message": "Keyword research agent started"}


@router.post("/competitive-analysis")
async def run_competitive_agent(request: CompetitiveAgentRequest):
    """Run autonomous competitive analysis agent"""
    task_id = await agent_orchestrator.start_task(
        AgentType.COMPETITIVE_ANALYSIS,
        {"your_domain": request.your_domain, "competitors": request.competitors, "options": request.options}
    )
    return {"success": True, "task_id": task_id, "message": "Competitive analysis agent started"}


@router.post("/full-strategy")
async def run_full_strategy_agent(request: FullStrategyRequest):
    """Run full SEO strategy agent (orchestrates all other agents)"""
    task_id = await agent_orchestrator.start_task(
        AgentType.FULL_SEO_STRATEGY,
        {"domain": request.domain, "target_keywords": request.target_keywords, "competitors": request.competitors}
    )
    return {"success": True, "task_id": task_id, "message": "Full SEO strategy agent started"}


@router.get("/status/{task_id}")
async def get_agent_status(task_id: str):
    """Get agent task status and results"""
    task = agent_orchestrator.get_task_status(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "data": task}


@router.get("/tasks")
async def list_agent_tasks():
    """List all agent tasks"""
    tasks = agent_orchestrator.list_tasks()
    return {"success": True, "data": tasks, "total": len(tasks)}
