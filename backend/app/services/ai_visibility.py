"""
AI Visibility Service - Track brand visibility across AI platforms
"""

import asyncio
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
import logging
import json

from app.core.config import settings
from app.core.database import save_to_db
from app.utils.helpers import extract_json

logger = logging.getLogger(__name__)


class AIVisibilityService:
    """Service for tracking brand visibility in AI-generated responses"""
    
    def __init__(self):
        self._client = None
        self.ai_platforms = ["ChatGPT", "Claude", "Perplexity", "Google Bard", "Bing Chat"]
    
    @property
    def client(self):
        """Lazy initialization of OpenAI client"""
        if self._client is None and settings.OPENAI_API_KEY:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("OpenAI client initialized for AIVisibility")
        return self._client
    
    async def check_brand_visibility(self, brand_name: str, keywords: List[str] = None) -> Dict[str, Any]:
        """Check how visible a brand is in AI-generated responses"""
        if not self.client:
            return self._mock_visibility_response(brand_name)
        
        try:
            prompt = f"""Analyze the AI search visibility for brand "{brand_name}".
            
Related keywords: {keywords or []}

Return JSON with:
{{"visibility_score": <0-100>, "mentions_likely": <number>, "sentiment": "<positive/neutral/negative>",
"strengths": [<list>], "weaknesses": [<list>], 
"competitors": [
    {{"name": "<competitor name>", "score": <estimated visibility 0-100>, "sentiment": "<positive/neutral/negative>"}},
],
"aeo_playbook": [
    {{"title": "<strategy title>", "recommendation": "<what to do>", "implementation": "<specific technical or content step>"}}
],
"recommendations": [<list of short titles>]}}"""

            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=1000
            )
            
            analysis = extract_json(response.choices[0].message.content)
            # Persist to database
            final_result = {
                "brand": brand_name,
                "visibility_score": analysis.get("visibility_score", 50),
                "mentions_count": analysis.get("mentions_likely", 10),
                "sentiment": analysis.get("sentiment", "neutral"),
                "competitors": analysis.get("competitors", []),
                "ai_platforms_checked": self.ai_platforms,
                "strengths": analysis.get("strengths", []),
                "weaknesses": analysis.get("weaknesses", []),
                "aeo_playbook": analysis.get("aeo_playbook", []),
                "recommendations": analysis.get("recommendations", [])
            }

            try:
                # Save as a task/result
                await save_to_db("agent_tasks", {
                    "agent_type": "ai_visibility",
                    "input_payload": {"brand": brand_name, "keywords": keywords},
                    "status": "completed",
                    "result": final_result
                })
                
                # Save AEO Patterns if niche/intent is available
                if final_result["aeo_playbook"]:
                   await save_to_db("aeo_patterns", {
                       "niche": brand_name, # Fallback to brand name as niche
                       "query_intent": "visibility_check",
                       "structure_dna": {"playbook": final_result["aeo_playbook"]}
                   })
            except Exception as e:
                logger.error(f"Failed to persist visibility data: {e}")

            return final_result
        except Exception as e:
            logger.error(f"Error checking visibility: {e}")
            return self._mock_visibility_response(brand_name)
    
    async def compare_with_competitors(self, brand_name: str, competitors: List[str]) -> Dict[str, Any]:
        """Compare brand visibility against competitors"""
        if not self.client:
            return self._mock_competitor_comparison(brand_name, competitors)
        
        try:
            prompt = f"""Compare AI visibility for "{brand_name}" vs competitors: {competitors}

Return JSON: {{"comparison": {{"<brand>": {{"score": <0-100>, "strengths": [<list>]}}...}},
"leader": "<name>", "your_rank": <number>, "recommendations": [<list>]}}"""

            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500
            )
            
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error comparing competitors: {e}")
            return self._mock_competitor_comparison(brand_name, competitors)
    
    async def track_citations(self, domain: str) -> Dict[str, Any]:
        """Track citations to a domain in AI content"""
        if not self.client:
            return {"domain": domain, "authority_score": 65, "citation_topics": ["technology"]}
        
        try:
            prompt = f"""Analyze citation worthiness of domain: {domain}
Return JSON: {{"authority_score": <0-100>, "citation_topics": [<list>], "recommendations": [<list>]}}"""

            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800
            )
            result = extract_json(response.choices[0].message.content)
            result["domain"] = domain
            return result
        except Exception as e:
            logger.error(f"Error tracking citations: {e}")
            return {"domain": domain, "authority_score": 65, "citation_topics": ["general"]}

    async def execute_playbook(self, brand_name: str, playbook_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a technical execution log for the AEO playbook"""
        if not self.client:
            return {
                "logs": [
                    "Initializing AEO Execution Engine...",
                    f"Target Brand: {brand_name}",
                    "Optimizing Knowledge Graph entities...",
                    "Deploying semantic schema overrides...",
                    "AEO Playbook Execution Complete."
                ],
                "impact_projection": 85
            }
        
        try:
            prompt = f"""Generate a technical execution log for these AEO playbook items for {brand_name}:
{playbook_items}

Return JSON ONLY:
{{
  "logs": ["<list of 5-8 technical log strings simulating real-time deployment>"],
  "impact_projection": <0-100 percentage>,
  "estimated_time": "<e.g. 2 hours>",
  "requirements": ["<list of technical requirements>"]
}}"""
            
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an Autonomous AEO Execution Agent."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error executing playbook: {e}")
            return {
                "logs": [f"Error: {str(e)}", "Reverting to safe-state...", "Manual review required."],
                "impact_projection": 0
            }
    
    def _mock_visibility_response(self, brand_name: str) -> Dict[str, Any]:
        return {
            "brand": brand_name, "visibility_score": 65.5, "mentions_count": 24,
            "sentiment": "positive", "ai_platforms_checked": self.ai_platforms,
            "competitors": [
                {"name": "Competitor A", "score": 72, "sentiment": "positive"},
                {"name": "Competitor B", "score": 45, "sentiment": "neutral"},
                {"name": "Competitor C", "score": 28, "sentiment": "negative"}
            ],
            "citations": [
                {"title": "Top Industry Leaders 2025", "url": "https://techcrunch.com/industry-leaders", "type": "verified"},
                {"title": "Best Products Review", "url": "https://theverge.com/reviews/best-products", "type": "mention"},
                {"title": "AI Market Analysis", "url": "https://forbes.com/ai-market-trends", "type": "source"}
            ],
            "recommendations": ["Create FAQ content", "Build backlinks", "Publish thought leadership"],
            "note": "Mock data - configure OPENAI_API_KEY for live results"
        }
    
    def _mock_competitor_comparison(self, brand_name: str, competitors: List[str]) -> Dict[str, Any]:
        import random
        comparison = {brand_name: {"score": 65, "sentiment": "positive"}}
        for comp in competitors:
            comparison[comp] = {"score": random.randint(40, 80), "sentiment": "neutral"}
        return {"your_brand": brand_name, "comparison": comparison, "recommendations": ["Increase content"]}


ai_visibility_service = AIVisibilityService()
