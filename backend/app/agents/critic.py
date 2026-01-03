from typing import Dict, Any, List, Optional
import json
import logging
from app.core.config import settings
from app.services.ai_visibility import ai_visibility_service
from app.utils.helpers import extract_json

logger = logging.getLogger(__name__)

class CriticAgent:
    """
    The Critic: Adversarial AI that enforces quality and 'Citability DNA'.
    Acts as a gatekeeper before content is published.
    """
    
    def __init__(self):
        self.ai_service = ai_visibility_service
        self.max_iterations = 3
        
    async def critique_content(self, draft: str, brief: Dict[str, Any], iteration: int = 1) -> Dict[str, Any]:
        """
        Evaluate content against strict AEO standards.
        Returns: {
            "score": 0-100,
            "passed": bool,
            "feedback": "Specific instructions...",
            "aeo_validation": {...}
        }
        """
        logger.info(f"Critic reviewing draft (Iteration {iteration})")
        
        # 1. Validation Logic
        if iteration > self.max_iterations:
            logger.warning("Max iterations reached. Forcing pass with warning.")
            return {
                "score": 70,
                "passed": True,
                "feedback": "Max iterations reached. Manual review recommended.",
                "status": "completed_with_warnings"
            }

        # 2. Adversarial Prompt
        prompt = f"""You are the TOUGHEST Editor-in-Chief and SEO Critic.
Your job is to REJECT content that doesn't meet "Citability DNA" standards.

Target Keyword: {brief.get('target_keyword')}
Target Tone: {brief.get('tone')}

Critique this draft:
{draft[:4000]}... (truncated)

Criteria:
1. Entity Density: Are there concrete facts, numbers, and entities? (No fluff)
2. Structure: Are headers clear? Is the answer to the user's query immediate?
3. Citability: Would Perplexity/ChatGPT cite this as a primary source?
4. Formatting: Proper use of lists, bolding, and schema-ready structure.

Return JSON:
{{
    "score": <0-100>,
    "passed": <true if score >= 90>,
    "hard_feedback": "<bullet points of EXACTLY what to fix. Be mean. Be specific.>",
    "aeo_issues": ["<list of issues>"]
}}"""

        try:
            # Using the AI service's client directly for now
            if not self.ai_service.client:
                return self._mock_critique()
                
            response = await self.ai_service.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2 # Low temperature for strictness
            )
            
            result = extract_json(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"Critic failed: {e}")
            return self._mock_critique()

    def _mock_critique(self) -> Dict[str, Any]:
        return {
            "score": 85,
            "passed": False,
            "feedback": "Mock Critique: Add more specific examples and data points.",
            "aeo_issues": ["Low entity density"]
        }

critic_agent = CriticAgent()
