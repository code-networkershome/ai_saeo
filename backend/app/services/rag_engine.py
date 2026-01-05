"""
RAG Engine Service
Handles semantic embeddings via OpenAI and vector search in Supabase
"""

import logging
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.database import get_supabase

logger = logging.getLogger(__name__)

class RAGEngineService:
    """Service for Retrieval-Augmented Generation using OpenAI and Supabase Vector"""
    
    def __init__(self):
        self._client = None

    @property
    def client(self):
        """Lazy initialization of OpenAI client"""
        if self._client is None and settings.OPENAI_API_KEY:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding for a text string using OpenAI"""
        if not text or not self.client:
            return []

        try:
            response = await self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text.replace("\n", " ")
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Failed to get embedding from OpenAI: {e}")
            return []

    async def store_knowledge(self, name: str, facts: Dict[str, Any], entity_type: str = "Insight"):
        """Store an entity with its embedding in the knowledge_entities table"""
        supabase = get_supabase()
        if not supabase:
            return None

        # Create search text from facts and name
        facts_summary = f"Type: {entity_type}, Facts: {str(facts)}"
        search_text = f"{name}: {facts_summary}"
        embedding = await self.get_embedding(search_text)

        data = {
            "name": name,
            "type": entity_type,
            "facts": facts,
            "embedding": embedding if embedding else None,
            "updated_at": "now()"
        }

        try:
            # Check if entity already exists
            existing = supabase.table("knowledge_entities").select("id").eq("name", name).execute()
            
            if existing.data:
                result = supabase.table("knowledge_entities").update(data).eq("name", name).execute()
            else:
                result = supabase.table("knowledge_entities").insert(data).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error storing knowledge: {e}")
            return None

    async def query_knowledge(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Perform semantic search for relevant knowledge"""
        supabase = get_supabase()
        if not supabase:
            return []

        embedding = await self.get_embedding(query)
        if not embedding:
            return []

        try:
            # We use an RPC call for vector similarity search
            result = supabase.rpc(
                "match_entities", 
                {
                    "query_embedding": embedding,
                    "match_threshold": 0.5,
                    "match_count": limit
                }
            ).execute()
            
            return result.data or []
        except Exception as e:
            logger.warning(f"Vector search failed: {e}")
            # Fallback to basic keyword search
            result = supabase.table("knowledge_entities").select("*").ilike("name", f"%{query}%").limit(limit).execute()
            return result.data or []

rag_engine = RAGEngineService()
