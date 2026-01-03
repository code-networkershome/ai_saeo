"""
Utility helpers for the SEO platform
"""

import re
import json
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
import hashlib


def extract_json(text: str) -> Any:
    """Extract and parse JSON from text, handling markdown blocks"""
    try:
        # Quick attempt
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Remove markdown code blocks
    pattern = r"```(?:json)?\s*(.*?)\s*```"
    match = re.search(pattern, text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
            
    # Raise error if still fails
    raise json.JSONDecodeError("Could not extract JSON from text", text, 0)


def normalize_url(url: str) -> str:
    """Normalize URL for consistent processing"""
    url = url.strip().lower()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip('/')


def extract_domain(url: str) -> str:
    """Extract domain from URL"""
    url = normalize_url(url)
    parsed = urlparse(url)
    return parsed.netloc


def calculate_keyword_density(content: str, keyword: str) -> float:
    """Calculate keyword density in content"""
    if not content or not keyword:
        return 0.0
    words = content.lower().split()
    keyword_count = sum(1 for w in words if keyword.lower() in w)
    return round((keyword_count / len(words)) * 100, 2) if words else 0.0


def estimate_reading_time(content: str, wpm: int = 200) -> int:
    """Estimate reading time in minutes"""
    word_count = len(content.split())
    return max(1, round(word_count / wpm))


def generate_slug(title: str) -> str:
    """Generate URL-friendly slug from title"""
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


def hash_content(content: str) -> str:
    """Generate hash for content deduplication"""
    return hashlib.sha256(content.encode()).hexdigest()[:16]


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate text to max length"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def extract_meta_from_html(html: str) -> Dict[str, Any]:
    """Extract meta information from HTML"""
    from bs4 import BeautifulSoup
    
    soup = BeautifulSoup(html, 'lxml')
    
    return {
        "title": soup.title.string if soup.title else None,
        "meta_description": soup.find("meta", {"name": "description"})["content"] if soup.find("meta", {"name": "description"}) else None,
        "meta_keywords": soup.find("meta", {"name": "keywords"})["content"] if soup.find("meta", {"name": "keywords"}) else None,
        "canonical": soup.find("link", {"rel": "canonical"})["href"] if soup.find("link", {"rel": "canonical"}) else None,
        "og_title": soup.find("meta", {"property": "og:title"})["content"] if soup.find("meta", {"property": "og:title"}) else None,
        "og_description": soup.find("meta", {"property": "og:description"})["content"] if soup.find("meta", {"property": "og:description"}) else None,
    }


def score_seo_element(element: str, element_type: str) -> Dict[str, Any]:
    """Score an SEO element like title or meta description"""
    result = {"element": element, "type": element_type, "score": 0, "issues": []}
    
    if element_type == "title":
        if not element:
            result["issues"].append("Missing title")
            result["score"] = 0
        elif len(element) < 30:
            result["issues"].append("Title too short (< 30 chars)")
            result["score"] = 60
        elif len(element) > 60:
            result["issues"].append("Title too long (> 60 chars)")
            result["score"] = 70
        else:
            result["score"] = 100
            
    elif element_type == "meta_description":
        if not element:
            result["issues"].append("Missing meta description")
            result["score"] = 0
        elif len(element) < 120:
            result["issues"].append("Meta description too short (< 120 chars)")
            result["score"] = 60
        elif len(element) > 160:
            result["issues"].append("Meta description too long (> 160 chars)")
            result["score"] = 70
        else:
            result["score"] = 100
    
    return result
