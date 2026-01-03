from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import hashlib

# Mock database for edge overrides until we implement actual DB connection
# In production this would query the 'edge_overrides' table in Supabase
_edge_db: Dict[str, Dict] = {}

router = APIRouter()

class EdgeOverrideResponse(BaseModel):
    found: bool
    url_hash: str
    injections: Dict[str, Any] = {}

class EdgeOverrideCreate(BaseModel):
    url: str
    title: Optional[str] = None
    meta_description: Optional[str] = None
    schema_json: Optional[Dict] = None

@router.get("/get/{url_hash}")
async def get_edge_override(url_hash: str):
    """
    Edge Worker Endpoint:
    Called by Cloudflare/Vercel Middleware to check for SEO injections.
    Must respond in <50ms.
    """
    override = _edge_db.get(url_hash)
    
    if not override:
        return {"found": False, "url_hash": url_hash}
    
    return {
        "found": True, 
        "url_hash": url_hash,
        "injections": {
            "title": override.get("title"),
            "meta_description": override.get("meta_description"),
            "schema": override.get("schema_json")
        }
    }

@router.post("/set")
async def set_edge_override(data: EdgeOverrideCreate):
    """
    Admin Endpoint:
    Sets the 'Optimized State' for a URL.
    """
    # Create MD5 hash of URL for fast lookup
    url_hash = hashlib.md5(data.url.strip().lower().encode()).hexdigest()
    
    _edge_db[url_hash] = {
        "url": data.url,
        "title": data.title,
        "meta_description": data.meta_description,
        "schema_json": data.schema_json
    }
    
    return {
        "success": True, 
        "url_hash": url_hash,
        "status": "Override active"
    }
