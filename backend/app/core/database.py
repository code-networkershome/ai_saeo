"""
Database Configuration
Supabase client initialization and helper functions
"""

from supabase import create_client, Client
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global Supabase client
_supabase_client: Optional[Client] = None


def get_supabase() -> Optional[Client]:
    """Get or create Supabase client"""
    global _supabase_client
    
    if _supabase_client is None:
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                _supabase_client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_KEY
                )
                logger.info("✅ Supabase client initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Supabase: {e}")
                return None
        else:
            logger.warning("⚠️ Supabase credentials not configured")
            return None
    
    return _supabase_client


async def save_to_db(table: str, data: dict) -> Optional[dict]:
    """Save data to Supabase table"""
    client = get_supabase()
    if client:
        try:
            result = client.table(table).insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Database insert error: {e}")
            return None
    return None


async def get_from_db(table: str, filters: dict = None, limit: int = 100) -> list:
    """Get data from Supabase table"""
    client = get_supabase()
    if client:
        try:
            query = client.table(table).select("*")
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            result = query.limit(limit).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Database query error: {e}")
            return []
    return []


async def update_in_db(table: str, id: str, data: dict) -> Optional[dict]:
    """Update data in Supabase table"""
    client = get_supabase()
    if client:
        try:
            result = client.table(table).update(data).eq("id", id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Database update error: {e}")
            return None
    return None
