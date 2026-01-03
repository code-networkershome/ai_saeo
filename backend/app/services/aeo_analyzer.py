from typing import Dict, Any, List
import logging
from app.core.config import settings
from app.services.ai_visibility import ai_visibility_service
from app.utils.helpers import extract_json

logger = logging.getLogger(__name__)

class AEOAnalyzerService:
    """
    AEO 2.0 Layer - Citability DNA Analyzer.
    Analyzes SERP/AI results to reverse-engineer winning structures.
    """
    
    async def analyze_winning_pattern(self, keyword: str) -> Dict[str, Any]:
        """
        Queries OpenAI to analyze 'Why' certain answers rank in Perplexity/ChatGPT.
        Returns the 'Citability DNA'.
        """
        logger.info(f"Analyzing AEO DNA for: {keyword}")
        
        prompt = f"""Analyze the "Winning Pattern" for the keyword: "{keyword}"
        
Imagine you are Perplexity AI. What characteristics make a source "citable" for this query?
Reverse engineer the perfect response structure.

Return JSON:
{{
    "niche": "<category>",
    "query_intent": "<informational/commercial>",
    "structural_dna": {{
        "avg_paragraph_length_words": <int>,
        "preferred_schema": ["<schema1>", "<schema2>"],
        "entity_density_score": <0-10>,
        "requires_table": <bool>,
        "requires_code_block": <bool>
    }},
    "content_template": [
        {{"section": "Introduction", "must_include": ["<definition>", "<stat>"]}},
        {{"section": "Main Body", "structure": "<list/comparison>"}}
    ]
}}"""
        
        try:
            if not ai_visibility_service.client:
                return self._mock_dna(keyword)
                
            response = await ai_visibility_service.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500
            )
            
            return extract_json(response.choices[0].message.content)
            
        except Exception as e:
            logger.error(f"Error analyzing AEO DNA: {e}")
            return self._mock_dna(keyword)

    def _mock_dna(self, keyword: str) -> Dict[str, Any]:
        return {
            "niche": "Tech",
            "structural_dna": {
                "preferred_schema": ["FAQPage"],
                "entity_density_score": 8.5
            }
        }

aeo_analyzer_service = AEOAnalyzerService()
