from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.rag_engine import rag_engine
from openai import AsyncOpenAI
from app.core.config import settings
import logging

router = APIRouter(prefix="/chat", tags=["🤖 Chat Assistant"])
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str
    context_domain: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    sources: List[str]

@router.post("/", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    """
    RAG-powered chat that knows the user's previous audits and activity.
    """
    try:
        # 1. Fetch relevant context from RAG engine
        query = request.message
        if request.context_domain:
            query = f"{request.context_domain}: {request.message}"
            
        context_items = await rag_engine.query_knowledge(query, limit=5)
        
        context_str = "\n".join([
            f"- {item.get('name')}: {str(item.get('facts'))}" 
            for item in context_items if item.get('facts')
        ])

        # 2. Build the "Informed" prompt
        tool_manifesto = """
        PLATFORM KNOWLEDGE (SAEO.ai):
        - SAEO.ai is an "Answer Engine Optimization" (AEO) and SEO platform.
        - Tech Stack: FastAPI (Backend), React/Vite (Frontend), Supabase (Vector DB).
        - Core Tools (The 12-Tool Engine):
            1. GSC: Real impressions/clicks.
            2. OpenPageRank: Verified Domain Authority.
            3. CommonCrawl: Backlink graph analysis.
            4. DuckDuckGo: Clean Global SERP mapping.
            5. PageSpeed: Core Web Vitals.
            6. Wayback Machine: Domain history/Trust.
            7. SSL Labs: Security grading (A+).
            8. W3C Validator: Markup health.
            9. Firecrawl: JS-Scraping.
            10. SecurityHeaders.io: Header audit.
            11. Supabase: Domain RAM/Memory.
            12. GPT-4o: Strategic Orchestration.
        - Features: AEO Visibility Dashboards, Full Technical Audits, Keyword Analytics, Content Labs, and Competitor Intelligence.
        """

        system_prompt = f"""
        You are the SAEO.ai Intelligence Assistant (Co-Pilot). 
        You have access to the platform's technical documentation and the user's historical data.
        
        {tool_manifesto}
        
        CONTEXT FROM USER'S PREVIOUS ACTIVITY:
        {context_str if context_str else "No previous audits found. User might be new."}
        
        RULES:
        - If the user asks "What can you do?" or "How does this tool work?", explain the platform features (GSC, AEO, etc.).
        - If the user asks about their own site, use the context.
        - Be professional, technical, and data-driven.
        - Maintain a "Strategic Advisor" tone.
        """

        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        completion = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            temperature=0.7
        )

        ai_response = completion.choices[0].message.content
        sources = [item.get('name', 'General Insight') for item in context_items]

        return ChatResponse(response=ai_response, sources=sources)

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="The AI Assistant is currently recalibrating. Please try again in a moment.")
