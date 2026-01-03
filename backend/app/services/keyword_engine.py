"""
Keyword Research Engine - Keyword discovery, analysis, and SERP insights
"""

from typing import Dict, Any, List
from openai import AsyncOpenAI
import logging
import json
import httpx

from app.core.config import settings
from app.utils.helpers import extract_json

logger = logging.getLogger(__name__)


class KeywordEngineService:
    """Comprehensive keyword research and analysis service"""
    
    def __init__(self):
        self._client = None
    
    @property
    def client(self):
        """Lazy initialization of OpenAI client"""
        if self._client is None and settings.OPENAI_API_KEY:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("OpenAI client initialized for KeywordEngine")
        return self._client
    
    async def discover_keywords(self, seed_keyword: str, limit: int = 50) -> Dict[str, Any]:
        """Discover related keywords from a seed keyword"""
        if not self.client:
            return self._mock_keywords(seed_keyword, limit)
        
        prompt = f"""Generate {limit} keyword variations for: "{seed_keyword}"
        
Include:
- Long-tail variations
- Question-based keywords
- Commercial intent keywords
- Informational keywords

Return JSON: {{"keywords": [{{"keyword": "<text>", "search_volume_estimate": "<high/medium/low>", 
"intent": "<informational/commercial/transactional/navigational>", "difficulty": "<easy/medium/hard>",
"strategy": "<one sentence on how to rank for this>"}}]}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=3000
            )
            data = extract_json(response.choices[0].message.content)
            data["seed_keyword"] = seed_keyword
            data["total_found"] = len(data.get("keywords", []))
            return data
        except Exception as e:
            logger.error(f"Error discovering keywords: {e}")
            return self._mock_keywords(seed_keyword, limit)
    
    async def analyze_keyword(self, keyword: str) -> Dict[str, Any]:
        """Analyze a specific keyword"""
        if not self.client:
            return self._mock_analysis(keyword)
        
        prompt = f"""Analyze SEO potential for keyword: "{keyword}"

Return JSON:
{{"keyword": "{keyword}", "search_volume_estimate": <number 100-100000>,
"difficulty_score": <0-100>, "cpc_estimate": <0.5-50>,
"competition": "<low/medium/high>", "intent": "<type>",
"trend": "<rising/stable/declining>",
"related_topics": [<list>], "serp_features_likely": [<list>],
"ranking_difficulty_explanation": "<why easy/hard to rank>",
"content_recommendations": [<list>],
"domination_plan": "<detailed 3-step strategy to rank top 3>"}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000
            )
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error analyzing keyword: {e}")
            return self._mock_analysis(keyword)
    
    async def find_long_tail(self, keyword: str, count: int = 30) -> Dict[str, Any]:
        """Find long-tail keyword variations"""
        if not self.client:
            return {"keyword": keyword, "long_tail": [f"best {keyword} for beginners"]}
        
        prompt = f"""Generate {count} long-tail keyword variations for: "{keyword}"
Focus on:
- Specific use cases
- Location-based variations
- Comparison keywords
- "How to" variations
- "Best" variations

Return JSON: {{"keyword": "{keyword}", "long_tail": [{{"phrase": "<text>", "intent": "<type>", "difficulty": "<level>"}}]}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error finding long-tail: {e}")
            return {"keyword": keyword, "long_tail": []}
    
    async def find_questions(self, keyword: str, count: int = 20) -> Dict[str, Any]:
        """Find question-based keywords"""
        if not self.client:
            return {"keyword": keyword, "questions": [f"What is {keyword}?", f"How does {keyword} work?"]}
        
        prompt = f"""Generate {count} question-based search queries for: "{keyword}"
Include: What, How, Why, When, Where, Which, Can, Does, Is, Are questions

Return JSON: {{"keyword": "{keyword}", "questions": [{{"question": "<text>", "intent": "<type>", "featured_snippet_potential": <true/false>}}]}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1200
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error finding questions: {e}")
            return {"keyword": keyword, "questions": []}
    
    async def analyze_serp(self, keyword: str) -> Dict[str, Any]:
        """Analyze SERP for a keyword"""
        if not self.client:
            return self._mock_serp(keyword)
        
        prompt = f"""Analyze what the Google SERP would look like for: "{keyword}"

Return JSON:
{{"keyword": "{keyword}",
"serp_features": [<"featured_snippet", "people_also_ask", "local_pack", "images", "videos", "shopping", "news">],
"organic_difficulty": <0-100>,
"top_ranking_content_types": [<"blog", "product", "video", "tool">],
"average_content_length": <words>,
"ranking_factors": [<important factors>],
"opportunity_score": <0-100>,
"recommendations": [<list>]}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error analyzing SERP: {e}")
            return self._mock_serp(keyword)
    
    async def cluster_keywords(self, keywords: List[str]) -> Dict[str, Any]:
        """Cluster keywords by topic/intent"""
        if not self.client:
            return {"clusters": [{"name": "General", "keywords": keywords}]}
        
        prompt = f"""Cluster these keywords by topic and intent: {keywords}

Return JSON: {{"clusters": [{{"name": "<cluster name>", "intent": "<type>", "keywords": [<list>], "recommended_page_type": "<type>"}}]}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error clustering: {e}")
            return {"clusters": [{"name": "Uncategorized", "keywords": keywords}]}
    
    def _mock_keywords(self, seed: str, limit: int) -> Dict[str, Any]:
        return {
            "seed_keyword": seed,
            "keywords": [
                {"keyword": f"best {seed}", "search_volume_estimate": "high", "intent": "commercial", "difficulty": "medium"},
                {"keyword": f"how to use {seed}", "search_volume_estimate": "medium", "intent": "informational", "difficulty": "easy"},
                {"keyword": f"{seed} vs competitor", "search_volume_estimate": "medium", "intent": "commercial", "difficulty": "medium"}
            ],
            "total_found": 3,
            "note": "Mock data - configure OPENAI_API_KEY for live results"
        }
    
    def _mock_analysis(self, keyword: str) -> Dict[str, Any]:
        return {
            "keyword": keyword,
            "search_volume_estimate": 5400,
            "difficulty_score": 45,
            "cpc_estimate": 2.50,
            "competition": "medium",
            "intent": "informational",
            "trend": "stable",
            "content_recommendations": ["Create comprehensive guide", "Include visuals"]
        }
    
    def _mock_serp(self, keyword: str) -> Dict[str, Any]:
        return {
            "keyword": keyword,
            "serp_features": ["featured_snippet", "people_also_ask"],
            "organic_difficulty": 55,
            "opportunity_score": 65,
            "recommendations": ["Target featured snippet", "Create in-depth content"]
        }


keyword_engine_service = KeywordEngineService()
