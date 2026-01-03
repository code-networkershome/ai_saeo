"""
External APIs Service
Handles connections to free tools: PageSpeed, Wayback Machine, SecurityHeaders, etc.
"""

import httpx
import logging
import asyncio
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class ExternalAPIService:
    """Service to interact with free external SEO tools and APIs"""

    async def get_pagespeed_metrics(self, url: str, strategy: str = "mobile") -> Dict[str, Any]:
        """Fetch PageSpeed Insights metrics (Core Web Vitals)"""
        if not settings.PAGESPEED_API_KEY:
            logger.warning("PAGESPEED_API_KEY not configured, skipping PageSpeed audit.")
            return {}

        api_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
        params = {
            "url": url,
            "key": settings.PAGESPEED_API_KEY,
            "strategy": strategy,
            "category": ["performance", "accessibility", "best-practices", "seo"]
        }

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.get(api_url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    categories = data.get("lighthouseResult", {}).get("categories", {})
                    return {
                        "performance": categories.get("performance", {}).get("score", 0) * 100,
                        "accessibility": categories.get("accessibility", {}).get("score", 0) * 100,
                        "best_practices": categories.get("best-practices", {}).get("score", 0) * 100,
                        "seo": categories.get("seo", {}).get("score", 0) * 100,
                        "vitals": data.get("loadingExperience", {}).get("metrics", {})
                    }
                logger.error(f"PageSpeed API error: {response.status_code} - {response.text}")
                return {}
        except Exception as e:
            logger.error(f"Failed to fetch PageSpeed metrics: {e}")
            return {}

    async def get_wayback_history(self, url: str) -> Dict[str, Any]:
        """Fetch domain age and first-seen date from Wayback Machine"""
        try:
            import waybackpy
            user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            wayback = waybackpy.Url(url, user_agent)
            oldest = wayback.oldest()
            if oldest:
                return {
                    "first_seen": oldest.timestamp.isoformat(),
                    "wayback_url": oldest.archive_url,
                    "versions_found": True
                }
            return {"versions_found": False}
        except Exception as e:
            logger.warning(f"Wayback Machine check failed: {e}")
            return {"error": str(e)}

    async def get_tech_stack(self, url: str) -> Dict[str, Any]:
        """Analyze tech stack using pattern matching on HTML and headers"""
        try:
            headers_to_send = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                response = await client.get(url, headers=headers_to_send)
                resp_headers = response.headers
                html = response.text.lower()
                
                tech = {
                    "cms": [],
                    "analytics": [],
                    "frameworks": [],
                    "cdn": []
                }
                
                # CMS Detection
                if "wp-content" in html or "wp-includes" in html or "wordpress" in html:
                    tech["cms"].append("WordPress")
                if "shopify" in html or "cdn.shopify" in html:
                    tech["cms"].append("Shopify")
                if "wix" in html or "wixsite" in html:
                    tech["cms"].append("Wix")
                if "squarespace" in html:
                    tech["cms"].append("Squarespace")
                if "drupal" in html or "sites/all" in html:
                    tech["cms"].append("Drupal")
                if "joomla" in html:
                    tech["cms"].append("Joomla")
                if "webflow" in html:
                    tech["cms"].append("Webflow")
                
                # Analytics Detection
                if "google-analytics" in html or "gtag(" in html or "ga(" in html or "googletagmanager" in html:
                    tech["analytics"].append("Google Analytics")
                if "fbevents.js" in html or "facebook.net/en_us/fbevents" in html:
                    tech["analytics"].append("Meta Pixel")
                if "hotjar" in html:
                    tech["analytics"].append("Hotjar")
                if "segment" in html and "analytics.js" in html:
                    tech["analytics"].append("Segment")
                if "mixpanel" in html:
                    tech["analytics"].append("Mixpanel")
                if "amplitude" in html:
                    tech["analytics"].append("Amplitude")
                
                # Framework Detection
                if "_next/" in html or "__next" in html or "next.js" in html:
                    tech["frameworks"].append("Next.js")
                if "react" in html or "reactdom" in html or "__react" in html:
                    tech["frameworks"].append("React")
                if "vue" in html or "__vue__" in html:
                    tech["frameworks"].append("Vue.js")
                if "angular" in html or "ng-version" in html:
                    tech["frameworks"].append("Angular")
                if "svelte" in html:
                    tech["frameworks"].append("Svelte")
                if "gatsby" in html:
                    tech["frameworks"].append("Gatsby")
                if "nuxt" in html:
                    tech["frameworks"].append("Nuxt.js")
                if "tailwind" in html:
                    tech["frameworks"].append("Tailwind CSS")
                if "bootstrap" in html:
                    tech["frameworks"].append("Bootstrap")
                
                # CDN Detection
                server = resp_headers.get("server", "").lower()
                via = resp_headers.get("via", "").lower()
                
                if "cloudflare" in server or "cloudflare" in resp_headers.get("cf-ray", ""):
                    tech["cdn"].append("Cloudflare")
                if "akamai" in server or "akamai" in via:
                    tech["cdn"].append("Akamai")
                if "fastly" in server or "fastly" in via:
                    tech["cdn"].append("Fastly")
                if "amazonaws" in html or "cloudfront" in resp_headers.get("x-amz-cf-id", ""):
                    tech["cdn"].append("AWS CloudFront")
                if "vercel" in server or "vercel" in html:
                    tech["cdn"].append("Vercel")
                if "netlify" in server:
                    tech["cdn"].append("Netlify")
                if "azureedge" in html:
                    tech["cdn"].append("Azure CDN")
                
                logger.info(f"Tech stack for {url}: {tech}")
                return tech
        except Exception as e:
            logger.error(f"Tech stack detection failed: {e}")
            return {}

    async def check_security_headers(self, url: str) -> Dict[str, Any]:
        """Audit security headers with weighted scoring and mitigation detection"""
        try:
            headers_to_send = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                response = await client.get(url, headers=headers_to_send)
                resp_headers = response.headers
                
                csp = resp_headers.get("content-security-policy", "").lower()
                hsts = resp_headers.get("strict-transport-security", "").lower()
                xfo = resp_headers.get("x-frame-options", "").lower()
                xcto = resp_headers.get("x-content-type-options", "").lower()
                pp = resp_headers.get("permissions-policy", "").lower()
                server = resp_headers.get("server", "").lower()
                
                # Detection Logic with Mitigations
                checks = {
                    "Strict-Transport-Security": {
                        "present": hsts != "",
                        "status": "Present" if hsts else "Missing",
                        "weight": 30
                    },
                    "Content-Security-Policy": {
                        "present": csp != "",
                        "status": "Present" if csp else "Missing",
                        "weight": 35
                    },
                    "X-Frame-Options": {
                        "present": xfo != "" or "frame-ancestors" in csp,
                        "status": "Present" if xfo else ("Mitigated via CSP" if "frame-ancestors" in csp else "Missing"),
                        "weight": 15
                    },
                    "X-Content-Type-Options": {
                        "present": xcto != "",
                        "status": "Present" if xcto else "Missing",
                        "weight": 10
                    },
                    "Permissions-Policy": {
                        "present": pp != "",
                        "status": "Present" if pp else "Missing",
                        "weight": 10
                    }
                }
                
                # CDN/Edge Awareness
                edge_managed = False
                edge_provider = None
                if any(x in server for x in ["akamai", "cloudflare", "fastly", "vercel", "netlify"]):
                    edge_managed = True
                    edge_provider = next((x.capitalize() for x in ["akamai", "cloudflare", "fastly", "vercel", "netlify"] if x in server), "Cloud Proxy")
                if "cf-ray" in resp_headers:
                    edge_managed = True
                    edge_provider = "Cloudflare"

                # Weighted Score Calculation
                total_weight = sum(c["weight"] for c in checks.values())
                passed_weight = sum(c["weight"] for c in checks.values() if c["present"])
                score = (passed_weight / total_weight) * 100
                
                logger.info(f"Security headers for {url}: {score}% (Edge: {edge_managed})")
                
                return {
                    "checks": {k: v["present"] for k, v in checks.items()},
                    "details": {k: v["status"] for k, v in checks.items()},
                    "security_score": score,
                    "edge_managed": edge_managed,
                    "edge_provider": edge_provider
                }
        except Exception as e:
            logger.error(f"Security headers check failed: {e}")
            return {}

    async def get_ddg_research(self, query: str) -> Dict[str, Any]:
        """Search DuckDuckGo (Free SERP proxy)"""
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=5))
                return {"results": results}
        except Exception as e:
            logger.error(f"DuckDuckGo search failed: {e}")
            return {"results": []}

external_apis = ExternalAPIService()
