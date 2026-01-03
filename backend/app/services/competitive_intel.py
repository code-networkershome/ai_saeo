"""
Competitive Intelligence Service - Competitor analysis and comparison
"""

from typing import Dict, Any, List
from openai import AsyncOpenAI
import logging
import json
import httpx

from app.core.config import settings
from app.utils.helpers import extract_json

logger = logging.getLogger(__name__)


class CompetitiveIntelService:
    """Competitive analysis and intelligence service"""
    
    def __init__(self):
        self._client = None
    
    @property
    def client(self):
        """Lazy initialization of OpenAI client"""
        if self._client is None and settings.OPENAI_API_KEY:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("OpenAI client initialized for CompetitiveIntel")
        return self._client
    
    async def analyze_competitor(self, domain: str) -> Dict[str, Any]:
        """Comprehensive competitor analysis"""
        if not self.client:
            return self._mock_competitor(domain)
        
        prompt = f"""Analyze the website/company: {domain}

Return JSON:
{{"domain": "{domain}",
"estimated_authority": <0-100>,
"estimated_traffic": "<low/medium/high/very high>",
"content_strategy": {{"frequency": "<weekly/daily>", "types": [<list>], "avg_length": <words>}},
"top_keywords_likely": [<10 keywords>],
"strengths": [<list>],
"weaknesses": [<list>],
"opportunities_against": [<how to compete>],
"battle_plan": "<detailed multi-step strategy to outrank them>"}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500
            )
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error analyzing competitor: {e}")
            return self._mock_competitor(domain)
    
    async def compare_domains(self, your_domain: str, competitors: List[str]) -> Dict[str, Any]:
        """Compare your domain against competitors"""
        if not self.client:
            return self._mock_comparison(your_domain, competitors)
        
        prompt = f"""Compare these domains: Your site: {your_domain}, Competitors: {competitors}

Return JSON:
{{"your_domain": "{your_domain}",
"comparison": [
    {{"domain": "<domain>", "authority_estimate": <0-100>, "traffic_estimate": "<level>", 
    "content_quality": <0-100>, "seo_strength": <0-100>}}
],
"your_position": <rank number>,
"key_differentiators": [<list>],
"gaps_to_close": [<list>],
"action_items": [<prioritized list>]}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000
            )
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error comparing domains: {e}")
            return self._mock_comparison(your_domain, competitors)
    
    async def find_content_gaps(self, your_domain: str, competitor_domains: List[str]) -> Dict[str, Any]:
        """Find content gaps between you and competitors"""
        if not self.client:
            return self._mock_content_gaps(your_domain)
        
        prompt = f"""Identify content gaps between {your_domain} and competitors: {competitor_domains}

Return JSON:
{{"your_domain": "{your_domain}",
"content_gaps": [
    {{"topic": "<topic>", "opportunity_score": <0-100>, "competitors_covering": [<domains>],
    "recommended_content_type": "<type>", "priority": "<high/medium/low>"}}
],
"quick_wins": [<easy topics to cover>],
"strategic_opportunities": [<long-term topics>]}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000
            )
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error finding content gaps: {e}")
            return self._mock_content_gaps(your_domain)
    
    async def estimate_traffic(self, domain: str) -> Dict[str, Any]:
        """Estimate domain traffic"""
        if not self.client:
            return {"domain": domain, "monthly_visits": 50000, "traffic_trend": "growing"}
        
        prompt = f"""Estimate traffic metrics for: {domain}

Return JSON:
{{"domain": "{domain}",
"monthly_visits_estimate": <number>,
"traffic_trend": "<growing/stable/declining>",
"top_traffic_sources": [<"organic", "direct", "referral", "social">],
"geographic_distribution": [<top countries>],
"mobile_vs_desktop": {{"mobile": <percent>, "desktop": <percent>}}}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800
            )
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error estimating traffic: {e}")
            return {"domain": domain, "monthly_visits_estimate": 50000, "traffic_trend": "stable"}
    
    async def backlink_analysis(self, domain: str) -> Dict[str, Any]:
        """Analyze backlink profile"""
        if not self.client:
            return self._mock_backlinks(domain)
        
        prompt = f"""Analyze backlink profile for: {domain}

Return JSON:
{{"domain": "{domain}",
"backlinks_estimate": <number>,
"referring_domains_estimate": <number>,
"domain_authority_estimate": <0-100>,
"link_quality": "<high/medium/low>",
"anchor_text_distribution": {{"branded": <percent>, "keyword": <percent>, "generic": <percent>}},
"top_referring_sources": [<list>],
"link_building_opportunities": [<list>]}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000
            )
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error analyzing backlinks: {e}")
            return self._mock_backlinks(domain)
    
    def _mock_competitor(self, domain: str) -> Dict[str, Any]:
        return {
            "domain": domain,
            "estimated_authority": 65,
            "estimated_traffic": "medium",
            "strengths": ["Good content", "Strong backlinks"],
            "weaknesses": ["Slow site speed", "Poor mobile UX"],
            "opportunities_against": ["Better content depth", "Faster loading"],
            "note": "Mock data"
        }
    
    def _mock_comparison(self, your_domain: str, competitors: List[str]) -> Dict[str, Any]:
        comparison = [{"domain": your_domain, "authority_estimate": 55, "seo_strength": 60}]
        for comp in competitors:
            comparison.append({"domain": comp, "authority_estimate": 65, "seo_strength": 70})
        return {"your_domain": your_domain, "comparison": comparison, "your_position": 2}
    
    def _mock_content_gaps(self, domain: str) -> Dict[str, Any]:
        return {
            "your_domain": domain,
            "content_gaps": [{"topic": "Industry trends", "opportunity_score": 80, "priority": "high"}],
            "quick_wins": ["FAQ pages", "How-to guides"]
        }
    
    def _mock_backlinks(self, domain: str) -> Dict[str, Any]:
        return {
            "domain": domain,
            "backlinks_estimate": 5000,
            "referring_domains_estimate": 350,
            "domain_authority_estimate": 45,
            "link_quality": "medium"
        }


competitive_intel_service = CompetitiveIntelService()
