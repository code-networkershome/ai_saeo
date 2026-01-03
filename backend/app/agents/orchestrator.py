"""
Autonomous Agent System - Multi-agent orchestration for automated SEO workflows
"""

import asyncio
from typing import Dict, Any, List, Optional
from enum import Enum
from datetime import datetime
import uuid
import logging

from app.services.ai_visibility import ai_visibility_service
from app.services.seo_auditor import seo_auditor_service
from app.services.content_engine import content_engine_service
from app.services.keyword_engine import keyword_engine_service
from app.services.competitive_intel import competitive_intel_service
from app.services.aeo_analyzer import aeo_analyzer_service
from app.agents.critic import critic_agent

logger = logging.getLogger(__name__)


class AgentType(str, Enum):
    SEO_AUDIT = "seo_audit"
    CONTENT_CREATION = "content_creation"
    KEYWORD_RESEARCH = "keyword_research"
    COMPETITIVE_ANALYSIS = "competitive_analysis"
    FULL_SEO_STRATEGY = "full_seo_strategy"


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


# In-memory task storage (use Redis/DB in production)
_tasks: Dict[str, Dict[str, Any]] = {}


class SEOAuditAgent:
    """Autonomous SEO Audit Agent"""
    
    async def run(self, url: str, options: Dict = None) -> Dict[str, Any]:
        """Run full SEO audit with recommendations"""
        results = {
            "audit": await seo_auditor_service.full_audit(url),
            "recommendations": [],
            "priority_fixes": []
        }
        
        # Generate AI-powered recommendations
        issues = results["audit"].get("issues", [])
        critical = [i for i in issues if i.get("severity") == "critical"]
        warnings = [i for i in issues if i.get("severity") == "warning"]
        
        results["priority_fixes"] = critical[:5]
        results["summary"] = {
            "critical_issues": len(critical),
            "warnings": len(warnings),
            "overall_health": "good" if len(critical) == 0 else "needs_attention"
        }
        
        return results


class ContentCreationAgent:
    """Autonomous Content Creation Agent"""
    
    async def run(self, topic: str, keyword: str, options: Dict = None) -> Dict[str, Any]:
        """Complete content creation workflow with Adversarial Critic Loop"""
        options = options or {}
        
        # Step 1: Generate AEO Citability DNA (AEO 2.0)
        logger.info(f"Analyzing AEO DNA for '{keyword}'...")
        aeo_dna = await aeo_analyzer_service.analyze_winning_pattern(keyword)
        
        # Step 2: Generate brief (enriched with DNA)
        brief = await content_engine_service.generate_content_brief(topic, keyword)
        brief["aeo_dna"] = aeo_dna # Inject DNA into brief for reference
        
        # Step 3: Create outline
        outline = await content_engine_service.create_outline(topic, keyword)
        
        # Step 4: Generate titles and meta
        titles = await content_engine_service.generate_titles(keyword, 3)
        
        # Step 4: Generate Draft Content
        word_count = options.get("word_count", 1500)
        draft_content = None
        
        if options.get("generate_content", True):
            # A. Initial Draft
            logger.info("Generating initial draft...")
            draft = await content_engine_service.create_content(topic, keyword, word_count)
            draft_content = draft.get("content", "")
            
            # B. Adversarial Loop (The Critic)
            iteration = 1
            max_iterations = 3
            critic_logs = []
            
            while iteration <= max_iterations:
                critique = await critic_agent.critique_content(draft_content, brief, iteration)
                critic_logs.append({
                    "iteration": iteration,
                    "score": critique.get("score"),
                    "feedback": critique.get("feedback")
                })
                
                if critique.get("passed", False):
                    logger.info("Content passed Critic validation!")
                    break
                    
                logger.info(f"Critic rejected draft (Score: {critique.get('score')}). Revising...")
                
                # C. Revision Step
                revision_prompt = f"""Needs Revision. 
Critic Feedback: {critique.get('feedback')}
hard_feedback: {critique.get('hard_feedback')}

Original Content:
{draft_content}

Rewrite to address ALL feedback points."""
                
                revision = await content_engine_service.rewrite_content(draft_content, style="improve") # leveraging rewrite service
                draft_content = revision.get("rewritten", draft_content)
                iteration += 1
            
            # Update final draft with corrected content
            draft["content"] = draft_content
            draft["critic_history"] = critic_logs
        
        # Step 5: Generate schema
        schema = await content_engine_service.generate_schema("Article", {
            "headline": titles[0].get("title") if titles else topic,
            "description": "Meta description"
        })
        
        return {
            "brief": brief,
            "outline": outline,
            "titles": titles,
            "content": draft if draft_content else None,
            "schema": schema,
            "workflow_completed": True
        }


class KeywordResearchAgent:
    """Autonomous Keyword Research Agent"""
    
    async def run(self, seed_keyword: str, options: Dict = None) -> Dict[str, Any]:
        """Complete keyword research workflow"""
        options = options or {}
        
        # Step 1: Discover keywords
        discovered = await keyword_engine_service.discover_keywords(
            seed_keyword, options.get("limit", 50)
        )
        
        # Step 2: Find long-tail variations
        long_tail = await keyword_engine_service.find_long_tail(seed_keyword, 20)
        
        # Step 3: Find questions
        questions = await keyword_engine_service.find_questions(seed_keyword, 15)
        
        # Step 4: Analyze SERP
        serp = await keyword_engine_service.analyze_serp(seed_keyword)
        
        # Step 5: Cluster if enough keywords
        keywords_to_cluster = [k.get("keyword") for k in discovered.get("keywords", [])[:20]]
        clusters = await keyword_engine_service.cluster_keywords(keywords_to_cluster)
        
        return {
            "seed_keyword": seed_keyword,
            "discovered_keywords": discovered,
            "long_tail": long_tail,
            "questions": questions,
            "serp_analysis": serp,
            "clusters": clusters,
            "total_opportunities": len(discovered.get("keywords", [])) + len(long_tail.get("long_tail", []))
        }


class CompetitiveAnalysisAgent:
    """Autonomous Competitive Analysis Agent"""
    
    async def run(self, your_domain: str, competitors: List[str], options: Dict = None) -> Dict[str, Any]:
        """Complete competitive analysis workflow"""
        
        # Step 1: Analyze your domain
        your_analysis = await competitive_intel_service.analyze_competitor(your_domain)
        
        # Step 2: Analyze competitors
        competitor_analyses = {}
        for comp in competitors[:5]:  # Limit to 5
            competitor_analyses[comp] = await competitive_intel_service.analyze_competitor(comp)
        
        # Step 3: Compare domains
        comparison = await competitive_intel_service.compare_domains(your_domain, competitors)
        
        # Step 4: Find content gaps
        gaps = await competitive_intel_service.find_content_gaps(your_domain, competitors)
        
        # Step 5: Traffic estimates
        traffic = await competitive_intel_service.estimate_traffic(your_domain)
        
        return {
            "your_domain": your_domain,
            "your_analysis": your_analysis,
            "competitor_analyses": competitor_analyses,
            "comparison": comparison,
            "content_gaps": gaps,
            "traffic_estimate": traffic,
            "strategic_recommendations": comparison.get("action_items", [])
        }


class FullSEOStrategyAgent:
    """Master agent that orchestrates a complete SEO strategy"""
    
    async def run(self, domain: str, target_keywords: List[str], competitors: List[str] = None) -> Dict[str, Any]:
        """Run complete SEO strategy analysis"""
        results = {
            "domain": domain,
            "started_at": datetime.utcnow().isoformat()
        }
        
        # Run all agents in parallel where possible
        tasks = [
            SEOAuditAgent().run(domain),
            KeywordResearchAgent().run(target_keywords[0] if target_keywords else domain),
        ]
        
        if competitors:
            tasks.append(CompetitiveAnalysisAgent().run(domain, competitors))
        
        completed = await asyncio.gather(*tasks, return_exceptions=True)
        
        results["seo_audit"] = completed[0] if not isinstance(completed[0], Exception) else {"error": str(completed[0])}
        results["keyword_research"] = completed[1] if not isinstance(completed[1], Exception) else {"error": str(completed[1])}
        
        if len(completed) > 2:
            results["competitive_analysis"] = completed[2] if not isinstance(completed[2], Exception) else {"error": str(completed[2])}
        
        # Generate content for top keyword
        if target_keywords:
            content_result = await ContentCreationAgent().run(
                f"Guide to {target_keywords[0]}", target_keywords[0], {"generate_content": False}
            )
            results["content_strategy"] = content_result
        
        results["completed_at"] = datetime.utcnow().isoformat()
        results["recommendations"] = self._generate_priority_actions(results)
        
        return results
    
    def _generate_priority_actions(self, results: Dict) -> List[str]:
        """Generate prioritized action items"""
        actions = []
        
        # From SEO audit
        audit = results.get("seo_audit", {})
        if audit.get("summary", {}).get("critical_issues", 0) > 0:
            actions.append("URGENT: Fix critical SEO issues found in audit")
        
        # From keyword research
        kw_research = results.get("keyword_research", {})
        if kw_research.get("total_opportunities", 0) > 20:
            actions.append("HIGH: You have 20+ keyword opportunities to target")
        
        # From competitive analysis
        comp = results.get("competitive_analysis", {})
        if comp.get("content_gaps", {}).get("gaps"):
            actions.append("MEDIUM: Address content gaps vs competitors")
        
        return actions or ["Continue monitoring and creating quality content"]


class AgentOrchestrator:
    """Orchestrates and manages agent tasks"""
    
    def __init__(self):
        self.agents = {
            AgentType.SEO_AUDIT: SEOAuditAgent(),
            AgentType.CONTENT_CREATION: ContentCreationAgent(),
            AgentType.KEYWORD_RESEARCH: KeywordResearchAgent(),
            AgentType.COMPETITIVE_ANALYSIS: CompetitiveAnalysisAgent(),
            AgentType.FULL_SEO_STRATEGY: FullSEOStrategyAgent()
        }
    
    async def start_task(self, agent_type: AgentType, params: Dict[str, Any]) -> str:
        """Start an agent task and return task ID"""
        task_id = str(uuid.uuid4())
        
        _tasks[task_id] = {
            "id": task_id,
            "type": agent_type,
            "status": TaskStatus.PENDING,
            "params": params,
            "created_at": datetime.utcnow().isoformat(),
            "results": None,
            "logs": []
        }
        
        # Run task in background
        asyncio.create_task(self._run_task(task_id, agent_type, params))
        
        return task_id
    
    async def _run_task(self, task_id: str, agent_type: AgentType, params: Dict):
        """Execute agent task"""
        _tasks[task_id]["status"] = TaskStatus.RUNNING
        _tasks[task_id]["logs"].append(f"Started at {datetime.utcnow().isoformat()}")
        
        try:
            agent = self.agents.get(agent_type)
            if agent:
                if agent_type == AgentType.SEO_AUDIT:
                    result = await agent.run(params.get("url"), params.get("options"))
                elif agent_type == AgentType.CONTENT_CREATION:
                    result = await agent.run(params.get("topic"), params.get("keyword"), params.get("options"))
                elif agent_type == AgentType.KEYWORD_RESEARCH:
                    result = await agent.run(params.get("seed_keyword"), params.get("options"))
                elif agent_type == AgentType.COMPETITIVE_ANALYSIS:
                    result = await agent.run(params.get("your_domain"), params.get("competitors"), params.get("options"))
                elif agent_type == AgentType.FULL_SEO_STRATEGY:
                    result = await agent.run(params.get("domain"), params.get("target_keywords"), params.get("competitors"))
                else:
                    result = {"error": "Unknown agent type"}
                
                _tasks[task_id]["results"] = result
                _tasks[task_id]["status"] = TaskStatus.COMPLETED
                _tasks[task_id]["logs"].append(f"Completed at {datetime.utcnow().isoformat()}")
                
                # AEO 2.0: Extract Critic Score if available
                if isinstance(result, dict) and "critic_history" in result.get("content", {}):
                    history = result["content"]["critic_history"]
                    if history:
                        last_round = history[-1]
                        _tasks[task_id]["critic_score"] = last_round.get("score")
                        _tasks[task_id]["critic_feedback"] = last_round.get("feedback")
            else:
                raise ValueError(f"Unknown agent type: {agent_type}")
                
        except Exception as e:
            logger.error(f"Agent task {task_id} failed: {e}")
            _tasks[task_id]["status"] = TaskStatus.FAILED
            _tasks[task_id]["error"] = str(e)
            _tasks[task_id]["logs"].append(f"Failed: {e}")
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task status and results"""
        return _tasks.get(task_id)
    
    def list_tasks(self) -> List[Dict[str, Any]]:
        """List all tasks"""
        return list(_tasks.values())


# Global orchestrator instance
agent_orchestrator = AgentOrchestrator()
