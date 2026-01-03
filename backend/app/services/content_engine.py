"""
Content Intelligence Engine - AI-powered content creation and optimization
"""

from typing import Dict, Any, List, Optional
from openai import AsyncOpenAI
import logging
import json
import re

from app.core.config import settings
from app.utils.helpers import extract_json

logger = logging.getLogger(__name__)


class ContentEngineService:
    """AI-powered content creation and optimization service"""
    
    def __init__(self):
        self._client = None
    
    @property
    def client(self):
        """Lazy initialization of OpenAI client"""
        if self._client is None and settings.OPENAI_API_KEY:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("OpenAI client initialized for ContentEngine")
        return self._client

    
    async def generate_content_brief(self, topic: str, keyword: str, content_type: str = "blog_post") -> Dict[str, Any]:
        """Generate comprehensive content brief"""
        if not self.client:
            return self._mock_brief(topic, keyword)
        
        prompt = f"""Create a comprehensive content brief for: "{topic}"
Target keyword: {keyword}
Content type: {content_type}

Return JSON with:
{{"title": "<compelling title>", "meta_description": "<160 chars>",
"outline": [{{"section": "<name>", "points": [<list>]}}...],
"semantic_keywords": [<10-15 related keywords>],
"questions_to_answer": [<5-7 questions>],
"target_word_count": <number>,
"tone": "<recommended tone>"}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000
            )
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error generating brief: {e}")
            return self._mock_brief(topic, keyword)
    
    async def create_content(self, topic: str, keyword: str, word_count: int = 1500) -> Dict[str, Any]:
        """Generate full content article"""
        if not self.client:
            return self._mock_content(topic)
        
        prompt = f"""Write a comprehensive, SEO-optimized article about: "{topic}"
Primary keyword: {keyword}
Target length: {word_count} words

Include:
- Engaging introduction
- Clear section headings (H2, H3)
- Naturally integrated keywords
- Practical examples
- Strong conclusion with CTA

Write in a professional, engaging tone. Output the full article."""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=4000
            )
            content = response.choices[0].message.content
            
            return {
                "content": content,
                "word_count": len(content.split()),
                "keyword_density": content.lower().count(keyword.lower()) / len(content.split()) * 100
            }
        except Exception as e:
            logger.error(f"Error creating content: {e}")
            return self._mock_content(topic)
    
    async def generate_titles(self, keyword: str, count: int = 5) -> List[Dict[str, Any]]:
        """Generate optimized title tags"""
        if not self.client:
            return [{"title": f"Best {keyword} Guide 2024", "length": 25, "power_words": ["Best"]}]
        
        prompt = f"""Generate {count} SEO-optimized title tags for keyword: "{keyword}"
Each title should be:
- Under 60 characters
- Include the keyword naturally
- Use power words for CTR

Return JSON array: [{{"title": "<title>", "length": <chars>, "power_words": [<list>]}}]"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800
            )
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error generating titles: {e}")
            return [{"title": f"{keyword} - Complete Guide", "length": 30}]
    
    async def generate_meta_descriptions(self, keyword: str, context: str = None, count: int = 5) -> List[Dict[str, Any]]:
        """Generate meta descriptions"""
        if not self.client:
            return [{"description": f"Discover everything about {keyword}. Expert tips and guides.", "length": 60}]
        
        prompt = f"""Generate {count} compelling meta descriptions for keyword: "{keyword}"
Context: {context or 'General article'}
Requirements:
- 150-160 characters
- Include call-to-action
- Compelling and click-worthy

Return JSON array: [{{"description": "<text>", "length": <chars>, "has_cta": true}}]"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800
            )
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error generating meta: {e}")
            return [{"description": f"Learn about {keyword}. Get expert insights.", "length": 45}]
    
    async def create_outline(self, topic: str, keyword: str) -> Dict[str, Any]:
        """Create content outline"""
        if not self.client:
            return {"topic": topic, "sections": [{"heading": "Introduction", "subheadings": []}]}
        
        prompt = f"""Create a detailed content outline for: "{topic}"
Target keyword: {keyword}

Return JSON: {{"topic": "<topic>", "sections": [{{"heading": "<H2>", "subheadings": [<H3 list>], "key_points": [<list>]}}]}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500
            )
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error creating outline: {e}")
            return {"topic": topic, "sections": []}
    
    async def generate_schema(self, schema_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate JSON-LD schema markup"""
        if not self.client:
            return self._mock_schema(schema_type, data)
        
        prompt = f"""Generate valid JSON-LD schema markup for type: {schema_type}
Data provided: {json.dumps(data)}

Return the complete, valid JSON-LD schema object."""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000
            )
            schema = extract_json(response.choices[0].message.content)
            return {"schema": schema, "html": f'<script type="application/ld+json">{json.dumps(schema)}</script>'}
        except Exception as e:
            logger.error(f"Error generating schema: {e}")
            return self._mock_schema(schema_type, data)
    
    async def rewrite_content(self, text: str, style: str = "improve") -> Dict[str, Any]:
        """Rewrite content with specified style"""
        if not self.client:
            return {"original": text, "rewritten": text, "style": style}
        
        style_prompts = {
            "improve": "Improve clarity and engagement",
            "simplify": "Simplify for easier reading",
            "formal": "Make more formal and professional",
            "casual": "Make more casual and conversational",
            "expand": "Expand with more detail",
            "condense": "Condense while keeping key points"
        }
        
        prompt = f"""{style_prompts.get(style, 'Improve')}: 

{text}

Return only the rewritten text."""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000
            )
            return {"original": text, "rewritten": response.choices[0].message.content, "style": style}
        except Exception as e:
            logger.error(f"Error rewriting: {e}")
            return {"original": text, "rewritten": text, "error": str(e)}
    
    async def generate_ideas(self, topic: str, count: int = 10) -> List[Dict[str, Any]]:
        """Generate article ideas for a topic"""
        if not self.client:
            return [{"title": f"How to Master {topic}", "type": "how-to", "suggested_keyword": f"mastering {topic}", "target_audience": "beginners", "angle": "step-by-step guide"}]
        
        prompt = f"""Generate {count} unique, engaging article ideas for topic: "{topic}"

Return JSON array: [{{"title": "<title>", "type": "<how-to/listicle/guide/comparison/case-study>", "target_audience": "<who>", "angle": "<unique angle>", "suggested_keyword": "<best primary keyword for SEO>"}}]"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500
            )
            return extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error generating ideas: {e}")
            return [{"title": f"Guide to {topic}", "type": "guide", "suggested_keyword": f"{topic} guide", "target_audience": "general", "angle": "overview"}]
    
    async def summarize_content(self, content: str, length: str = "medium") -> Dict[str, Any]:
        """Summarize content"""
        if not self.client:
            return {"summary": content[:200] + "...", "length": length}
        
        length_map = {"short": "2-3 sentences", "medium": "1 paragraph", "long": "3-4 paragraphs"}
        
        prompt = f"""Summarize this content in {length_map.get(length, '1 paragraph')}:

{content}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500
            )
            return {"summary": response.choices[0].message.content, "length": length}
        except Exception as e:
            return {"summary": content[:200] + "...", "error": str(e)}
    
    def _mock_brief(self, topic: str, keyword: str) -> Dict[str, Any]:
        return {
            "title": f"Complete Guide to {topic}",
            "meta_description": f"Discover everything about {keyword}. Expert tips and strategies.",
            "outline": [{"section": "Introduction", "points": ["Overview", "Why it matters"]}],
            "semantic_keywords": [keyword, f"{keyword} tips", f"best {keyword}"],
            "questions_to_answer": [f"What is {keyword}?", f"How to use {keyword}?"],
            "target_word_count": 1500,
            "note": "Mock data - configure OPENAI_API_KEY for live results"
        }
    
    def _mock_content(self, topic: str) -> Dict[str, Any]:
        return {
            "content": f"# {topic}\n\nThis is placeholder content...",
            "word_count": 100,
            "note": "Mock data"
        }
    
    def _mock_schema(self, schema_type: str, data: Dict) -> Dict[str, Any]:
        schema = {"@context": "https://schema.org", "@type": schema_type, **data}
        return {"schema": schema, "html": f'<script type="application/ld+json">{json.dumps(schema)}</script>'}


content_engine_service = ContentEngineService()
