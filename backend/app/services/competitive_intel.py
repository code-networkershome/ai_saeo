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
        """
        Analyze competitor using REAL data from PageSpeed and SERP.
        NO AI GUESSING for metrics - uses actual performance data.
        """
        from app.services.external_apis import external_apis
        
        try:
            # Normalize domain
            if not domain.startswith('http'):
                url = f"https://{domain}"
            else:
                url = domain
                domain = domain.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
            
            # 1. Get REAL PageSpeed metrics
            pagespeed = await external_apis.get_pagespeed_metrics(url)
            
            # 2. Get REAL security headers
            security = await external_apis.check_security_headers(url)
            
            # 3. Get REAL tech stack
            tech_stack = await external_apis.get_tech_stack(url)
            
            # 4. Get REAL SERP presence
            serp = await external_apis.get_ddg_research(domain)
            serp_presence = len(serp.get("results", []))
            
            # 5. Get REAL domain history
            history = await external_apis.get_wayback_history(url)
            
            # 6. Get REAL Authority (OpenPageRank)
            authority_data = await external_apis.get_domain_authority(domain)
            opr_score = authority_data.get("domain_authority", 0)
            
            # 6. CALCULATE authority from real data
            performance_score = pagespeed.get("performance", 0) if pagespeed else 0
            security_score = security.get("security_score", 0) if security else 0
            history_score = 20 if history.get("versions_found") else 0
            presence_score = min(30, serp_presence * 6)  # Max 30 from SERP presence
            
            # Authority = weighted sum of real factors
            # Authority Source: OpenPageRank if available, else calculated
            if opr_score > 0:
                estimated_authority = opr_score
                auth_source = "openpagerank"
            else:
                # Fallback calculating
                estimated_authority = int(
                    (performance_score * 0.3) +  # 30% from performance
                    (security_score * 0.2) +      # 20% from security
                    history_score +               # 20% from domain age
                    presence_score                # 30% from SERP presence
                )
                estimated_authority = max(0, min(100, estimated_authority))
                auth_source = "calculated"
            
            # Determine traffic estimate from presence
            if serp_presence >= 5:
                traffic_estimate = "high"
            elif serp_presence >= 3:
                traffic_estimate = "medium"
            else:
                traffic_estimate = "low"
            
            # 7. Use AI ONLY for strategic recommendations
            opportunities = []
            if self.client:
                opportunities = await self._get_competitive_opportunities(
                    domain, estimated_authority, performance_score
                )
            
            logger.info(f"Analyzed competitor {domain}: authority {estimated_authority}, perf {performance_score}")
            
            return {
                "domain": domain,
                "estimated_authority": estimated_authority,
                "estimated_traffic": traffic_estimate,
                "performance_score": performance_score,
                "security_score": security_score,
                "tech_stack": tech_stack,
                "domain_age": "established" if history.get("versions_found") else "new/unknown",
                "serp_presence": serp_presence,
                "opportunities_against": opportunities,
                "data_source": "calculated",
                "confidence": "high" if pagespeed else "medium",
                "calculation_inputs": {
                    "performance": performance_score,
                    "security": security_score,
                    "history": history_score,
                    "presence": presence_score
                },
                "note": f"Authority from {auth_source} (Real Data)"
            }
            
        except Exception as e:
            logger.error(f"Error analyzing competitor: {e}")
            return {
                "domain": domain,
                "estimated_authority": 0,
                "data_source": "fallback",
                "confidence": "low",
                "error": str(e)
            }
    
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
    
    async def _get_competitive_opportunities(
        self, domain: str, authority: int, performance: float
    ) -> List[str]:
        """Use AI to generate competitive opportunities based on REAL data"""
        if not self.client:
            return []
        
        try:
            prompt = f"""Based on REAL competitive analysis for "{domain}":
- Calculated Authority: {authority}/100
- PageSpeed Performance: {performance}/100

Provide 3-4 specific competitive opportunities/weaknesses to exploit.
Return JSON: {{"opportunities": ["action 1", "action 2", ...]}}"""

            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=400
            )
            
            result = extract_json(response.choices[0].message.content)
            return result.get("opportunities", [])
        except Exception as e:
            logger.error(f"Error getting competitive opportunities: {e}")
            return []
    
    # ============= DEPRECATED MOCK FUNCTIONS =============
    # These should NOT be called from main code paths anymore.
    
    def _mock_competitor(self, domain: str) -> Dict[str, Any]:
        """DEPRECATED: Used only as fallback"""
        return {
            "domain": domain,
            "estimated_authority": 0,
            "data_source": "deprecated_mock"
        }
    
    def _mock_comparison(self, your_domain: str, competitors: List[str]) -> Dict[str, Any]:
        """DEPRECATED: Used only as fallback"""
        return {
            "your_domain": your_domain, 
            "comparison": [], 
            "data_source": "deprecated_mock"
        }
    
    def _mock_content_gaps(self, domain: str) -> Dict[str, Any]:
        """DEPRECATED: Used only as fallback"""
        return {
            "your_domain": domain,
            "content_gaps": [],
            "data_source": "deprecated_mock"
        }
    
    def _mock_backlinks(self, domain: str) -> Dict[str, Any]:
        """DEPRECATED: Used only as fallback"""
        return {
            "domain": domain,
            "backlinks_estimate": 0,
            "data_source": "deprecated_mock"
        }


competitive_intel_service = CompetitiveIntelService()
