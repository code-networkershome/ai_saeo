"""
SEO Auditor Service - Technical and on-page SEO analysis using Firecrawl
"""

import httpx
import asyncio
from typing import Dict, Any, List, Optional
import logging
from bs4 import BeautifulSoup

from app.core.config import settings
from openai import AsyncOpenAI
import json
from app.core.database import save_to_db
from app.services.external_apis import external_apis
from app.utils.helpers import extract_json
from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.google.com/",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "cross-site",
    "Sec-Fetch-User": "?1",
    "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "DNT": "1"
}

class SEOAuditorService:
    """Comprehensive SEO auditing service"""
    
    def __init__(self):
        self.firecrawl_key = settings.FIRECRAWL_API_KEY
        self.firecrawl_url = settings.FIRECRAWL_BASE_URL
        self._client = None
    
    @property
    def client(self):
        """Lazy initialization of OpenAI client"""
        if self._client is None and settings.OPENAI_API_KEY:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client
    
    async def full_audit(self, url: str, depth: int = 10) -> Dict[str, Any]:
        """Perform comprehensive SEO audit"""
        results = {
            "url": url,
            "overall_score": 0,
            "issues": [],
            "summary": {},
            "pages_crawled": 0
        }
        
        # Parallelize: Search is fast and gives us meta for blocked sites
        # We run all 3 sources concurrently for maximum speed
        fc_task = self._crawl_website(url, depth)
        basic_task = self._basic_crawl(url)
        search_task = self._get_search_metadata(url)
        
        fc_data, basic_data, search_data = await asyncio.gather(
            fc_task, basic_task, search_task
        )
        
        # Merging logic cleanup
        crawl_data = self._merge_results(fc_data, basic_data)
        
        # Recovery: If blocked, use search data for title/description
        if crawl_data.get("blocked") and search_data:
            if not crawl_data.get("title"):
                crawl_data["title"] = search_data.get("title")
            if not crawl_data.get("meta_description"):
                crawl_data["meta_description"] = search_data.get("description")
                
            # Heuristic: If we are blocked, we often can't see the H1.
            # Use search title as candidate for H1 to avoid false critical penalties.
            if not crawl_data.get("h1_tags") and search_data.get("title"):
                crawl_data["h1_tags"] = [search_data.get("title")]
        
        final_url = crawl_data.get("final_url", url)
        
        # TURBO PARALLELIZATION: Run all deep checks concurrently
        check_tasks = [
            self._check_technical_seo(final_url, crawl_data),
            self._check_on_page_seo(final_url, crawl_data),
            self._check_performance(url),
            self._check_business_intel(url),
            self._validate_schema(url, crawl_data)
        ]
        
        check_results = await asyncio.gather(*check_tasks, return_exceptions=True)
        
        # Unpack results with error handling
        technical, on_page, performance, business_intel, schema = [
            r if not isinstance(r, Exception) else {"score": 50, "issues": []} 
            for r in check_results
        ]
        
        results["technical_seo"] = technical
        results["on_page_seo"] = on_page
        results["performance"] = performance
        results["business_intelligence"] = business_intel
        results["schema_markup"] = schema
        
        # Add stats to technical
        results["technical_seo"]["links"] = crawl_data.get("links", 0)
        results["technical_seo"]["images"] = crawl_data.get("images", 0)
        
        # Calculate overall score
        scores = [
            technical.get("score", 50),
            on_page.get("score", 50),
            performance.get("score", 50),
            schema.get("score", 50)
        ]
        results["overall_score"] = sum(scores) / len(scores)
        results["pages_crawled"] = crawl_data.get("pages_count", 1)
        
        # Compile all issues
        for category in [technical, on_page, performance, schema]:
            results["issues"].extend(category.get("issues", []))
            
        # Add summary stats
        results["summary"] = {
            "title": on_page.get("title"),
            "meta_description": on_page.get("meta_description"),
            "h1_count": len(crawl_data.get("h1_tags", [])),
            "links": crawl_data.get("links", 0),
            "images": crawl_data.get("images", 0),
            "has_schema": schema.get("has_schema", False),
            "final_url": final_url
        }
        
        # Persist to Supabase
        try:
            domain = url.replace('https://', '').replace('http://', '').split('/')[0]
            
            # Optimization: Remove fields that are already top-level columns or redundant
            # We already have health_score and issues_found as columns
            db_payload = results.copy()
            # Remove redundant top-level keys that are redundant with summary or separate columns
            for key in ["overall_score", "url"]:
                if key in db_payload:
                    del db_payload[key]
            
            await save_to_db("site_audits", {
                "domain": domain,
                "audit_data": db_payload,
                "health_score": results["overall_score"],
                "issues_found": len(results["issues"])
            })
            logger.info(f"Successfully saved audit for {domain} to database.")
        except Exception as e:
            logger.error(f"Failed to persist audit to database: {e}")
        
        return results
    
    async def _get_search_metadata(self, url: str) -> Optional[Dict[str, str]]:
        """Fetch title and description from search engines (Instant Fallback)"""
        try:
            # We use duckduckgo_search to get a snippet instantly
            # Query format: "site:amazon.in/product-path"
            domain = url.replace("https://", "").replace("http://", "").split("/")[0]
            query = f"site:{url}"
            
            with DDGS() as ddgs:
                results = ddgs.text(query, region='in-en', max_results=1)
                if results:
                    first = results[0]
                    return {
                        "title": first.get("title"),
                        "description": first.get("body")
                    }
        except Exception as e:
            logger.warning(f"Search metadata fallback failed: {e}")
        return None

    async def _crawl_website(self, url: str, depth: int) -> Dict[str, Any]:
        """Crawl website using Firecrawl API"""
        if not self.firecrawl_key:
            return await self._basic_crawl(url)
        
        try:
            async with httpx.AsyncClient(timeout=90) as client:
                # Use standard payload validated in debug script
                params = {
                    "url": url, 
                    "formats": ["html"],
                    "onlyMainContent": False,
                    "waitFor": 3000
                }
                
                response = await client.post(
                    f"{self.firecrawl_url}/scrape",
                    headers={
                        "Authorization": f"Bearer {self.firecrawl_key}",
                        "Content-Type": "application/json"
                    },
                    json=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "data" in data:
                        scrape_data = data["data"]
                        html = scrape_data.get("html", "")
                        fc_metadata = scrape_data.get("metadata", {})
                        
                        # Use same block detection as basic crawl
                        blocked_keywords = ["captcha", "robot", "automated access", "security challenge", "human or not", "suspicious activity"]
                        html_lower = html.lower()[:2000]
                        is_blocked = (
                            len(html) < 800 or
                            any(kw in html_lower for kw in blocked_keywords)
                        )
                        
                        # Use our robust processor with Firecrawl metadata
                        result = self._process_html(html, url, fc_metadata)
                        result["status_code"] = 200
                        result["data_source"] = "firecrawl"
                        result["blocked"] = is_blocked
                        result["verified_content"] = not is_blocked
                        return result
                    
                logger.warning(f"Firecrawl scrape failed with status {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Firecrawl error: {e}")
        
        return await self._basic_crawl(url)
    
    async def _basic_crawl(self, url: str) -> Dict[str, Any]:
        """Basic crawl without Firecrawl"""
        try:
            async with httpx.AsyncClient(timeout=30, headers=DEFAULT_HEADERS, follow_redirects=True) as client:
                response = await client.get(url)
                html = response.text
                final_url = str(response.url)
                
                # Detect blocked/empty responses
                # Amazon and some sites return 202 or empty HTML when blocking bots
                # Use more diverse keywords for detection
                blocked_keywords = ["captcha", "robot", "automated access", "security challenge", "human or not", "suspicious activity"]
                html_lower = html.lower()[:2000]
                is_blocked = (
                    response.status_code in [202, 403, 429, 503] or
                    len(html) < 800 or
                    any(kw in html_lower for kw in blocked_keywords)
                )
                
                if is_blocked:
                    logger.warning(f"Site may be blocking crawler: {url} (status: {response.status_code}, html_len: {len(html)})")
                    return {
                        "status_code": response.status_code,
                        "pages_count": 1,
                        "blocked": True,
                        "blocked_reason": "Site blocks automated crawlers. Use Firecrawl API for full access.",
                        "final_url": final_url,
                        "html": html,
                        "title": self._extract_domain_name(url),
                        "meta_description": None,
                        "h1_tags": [],
                        "links": 0,
                        "images": 0
                    }
                
                result = self._process_html(html, final_url)
                result["status_code"] = response.status_code
                result["blocked"] = False
                result["verified_content"] = True
                
                return result
        except Exception as e:
            logger.error(f"Basic crawl error: {e}")
            return {"status_code": 500, "pages_count": 0, "error": str(e), "final_url": url, "html": "", "blocked": True}
    
    def _extract_domain_name(self, url: str) -> str:
        """Extract a clean domain name from URL for display"""
        try:
            domain = url.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
            # Capitalize first letter of each part
            parts = domain.split(".")
            return parts[0].capitalize() + ("." + parts[1] if len(parts) > 1 else "")
        except:
            return url

    def _process_html(self, html: str, url: str, metadata: Dict = None) -> Dict[str, Any]:
        """Standard process to extract SEO data from HTML and metadata"""
        if not html and not metadata:
            return {
                "html": "", "title": None, "meta_description": None,
                "h1_tags": [], "links": 0, "images": 0,
                "pages_count": 0, "final_url": url
            }
            
        soup = BeautifulSoup(html, 'lxml')
        
        # 1. Title extraction (Metadata first, then Soup)
        title_text = None
        if metadata:
            # Check various title keys case-insensitively
            title_keys = ['title', 'ogtitle', 'og:title', 'twitter:title', 'meta_title']
            for k, v in metadata.items():
                if k.lower() in title_keys and v:
                    title_text = str(v).strip()
                    break
        
        if not title_text:
            title_tag = soup.find('title')
            title_text = title_tag.get_text().strip() if title_tag else None
            
        # If still no title, try other meta tags in soup
        if not title_text:
            t_tag = soup.find('meta', attrs={'property': 'og:title'}) or \
                    soup.find('meta', attrs={'name': 'twitter:title'})
            if t_tag:
                title_text = t_tag.get('content', '').strip()
        
        # 2. Meta description (Metadata first, then Soup)
        meta_text = None
        if metadata:
            # Check various desc keys case-insensitively
            desc_keys = ['description', 'ogdescription', 'og:description', 'twitter:description', 'meta_description']
            for k, v in metadata.items():
                if k.lower() in desc_keys and v:
                    meta_text = str(v).strip()
                    break
                    
        if not meta_text:
            # Try various name variations in soup
            meta_tag = soup.find('meta', attrs={'name': lambda x: x and x.lower() == 'description'}) or \
                       soup.find('meta', attrs={'property': 'og:description'}) or \
                       soup.find('meta', attrs={'name': 'twitter:description'})
            
            if meta_tag:
                meta_text = meta_tag.get('content', '').strip()
        
        # 3. H1 tags
        h1_texts = [h.get_text().strip() for h in soup.find_all('h1')]
        
        # 4. Links and Images (from visible DOM)
        # Create a clean version of the soup for counting visible elements
        clean_soup = BeautifulSoup(html, 'lxml')
        for script_or_style in clean_soup(["script", "style"]):
            script_or_style.decompose()
        
        links_count = len(clean_soup.find_all("a"))
        images_count = len(clean_soup.find_all("img"))
        
        return {
            "html": html,
            "title": title_text,
            "meta_description": meta_text,
            "h1_tags": h1_texts,
            "links": links_count,
            "images": images_count,
            "pages_count": 1,
            "final_url": url
        }
    
    async def _check_technical_seo(self, url: str, crawl_data: Dict) -> Dict[str, Any]:
        """Check technical SEO and AI Discovery factors"""
        issues = []
        score = 100
        base_url = f"{url.split('://')[0]}://{url.split('://')[1].split('/')[0]}"
        
        async def check_file(filename: str, title: str, category: str = "technical", severity: str = "warning", score_impact: int = 5, is_optional: bool = False):
            file_url = f"{base_url.rstrip('/')}/{filename.lstrip('/')}"
            try:
                async with httpx.AsyncClient(timeout=10, headers=DEFAULT_HEADERS) as client:
                    resp = await client.get(file_url, follow_redirects=True)
                    if resp.status_code != 200:
                        if not is_optional:
                            issues.append({
                                "severity": severity,
                                "title": f"Missing {title}",
                                "description": f"No {filename} found at {file_url}",
                                "category": category,
                                "recommendation": f"Create a {filename} file to improve {'AI' if 'LLM' in title or 'AI' in title else 'technical'} discovery.",
                                "fix_available": True,
                                "file_path": filename
                            })
                            return score_impact
                    return 0
            except:
                return 0

        # Smart sitemap check - looks in robots.txt for Sitemap: directives
        async def check_sitemap() -> int:
            sitemap_url = f"{base_url.rstrip('/')}/sitemap.xml"
            robots_url = f"{base_url.rstrip('/')}/robots.txt"
            
            try:
                async with httpx.AsyncClient(timeout=10, headers=DEFAULT_HEADERS) as client:
                    # First, check if direct sitemap.xml exists
                    sitemap_resp = await client.get(sitemap_url, follow_redirects=True)
                    if sitemap_resp.status_code == 200:
                        return 0  # Sitemap found directly
                    
                    # If not, check robots.txt for Sitemap: directives
                    robots_resp = await client.get(robots_url, follow_redirects=True)
                    if robots_resp.status_code == 200:
                        robots_text = robots_resp.text.lower()
                        if 'sitemap:' in robots_text:
                            return 0  # Sitemaps referenced in robots.txt
                    
                    # No sitemap found anywhere
                    issues.append({
                        "severity": "warning",
                        "title": "Missing XML Sitemap",
                        "description": f"No sitemap.xml found at {sitemap_url} and no Sitemap: directives in robots.txt",
                        "category": "technical",
                        "recommendation": "Generate an XML sitemap and submit it to Google Search Console to help indexing.",
                        "fix_available": True,
                        "file_path": "sitemap.xml"
                    })
                    return 10
            except:
                return 0

        # Run checks in parallel
        check_tasks = [
            check_file("robots.txt", "robots.txt", score_impact=10),
            check_sitemap(),  # Smart sitemap detection
            check_file("humans.txt", "humans.txt", category="ai_discovery", score_impact=5),
            check_file("llms.txt", "llms.txt (AI Discovery)", category="ai_discovery", score_impact=10),
            check_file(".well-known/security.txt", "security.txt", category="security", score_impact=5),
            check_file("ads.txt", "ads.txt", category="monetization", is_optional=True),
            check_file("manifest.json", "Web App Manifest", category="mobile", is_optional=True),
        ]

        
        # Run API checks in parallel with file checks
        api_tasks = [
            external_apis.get_ssl_grade(url),
            external_apis.validate_html(url)
        ]
        
        # Combine all tasks
        all_results = await asyncio.gather(*(api_tasks + check_tasks))
        
        # Unpack results
        ssl_data = all_results[0]
        html_data = all_results[1]
        impacts = all_results[2:]
        
        score -= sum(impacts)
        
        # Process SSL Labs Data
        if ssl_data and ssl_data.get("data_source") == "ssllabs":
            grade = ssl_data.get("ssl_grade", "?")
            if grade in ["B", "C", "D", "E", "F"]:
                issues.append({
                    "severity": "critical" if grade in ["D", "E", "F"] else "warning",
                    "title": f"Weak SSL Grade ({grade})",
                    "description": "SSL Labs detected security weaknesses.",
                    "category": "security",
                    "recommendation": "Update TLS configuration and certs to achieve A or A+ grade."
                })
                score -= 10 if grade in ["B", "C"] else 20
        
        # Process W3C Validation Data
        if html_data and html_data.get("data_source") == "w3c_validator":
            start_errors = html_data.get("html_errors", 0)
            if start_errors > 0:
                issues.append({
                    "severity": "warning" if start_errors < 10 else "critical",
                    "title": f"{start_errors} HTML Validity Errors",
                    "description": "W3C Validator found standards compliance issues.",
                    "category": "technical",
                    "recommendation": "Fix HTML syntax errors to ensure cross-browser compatibility.",
                    "details": html_data.get("top_errors", [])
                })
                score -= min(15, start_errors)  # Cap penalty at 15 points
        
        # HTTPS Check
        if not url.startswith("https"):
            issues.append({
                "severity": "critical", 
                "title": "Not using HTTPS",
                "description": "Site not secured with SSL", 
                "category": "technical",
                "recommendation": "Install an SSL certificate to secure user data and improve search rankings.",
                "fix": "Force HTTPS redirection in your web server config."
            })
            score -= 20
        
        return {
            "score": max(0, score), 
            "issues": issues, 
            "checks_passed": 100 - len(issues) * 5,
            "ai_discovery_status": "configured" if any(i['category'] == 'ai_discovery' for i in issues) is False else "incomplete"
        }
    
    async def _check_on_page_seo(self, url: str, crawl_data: Dict) -> Dict[str, Any]:
        """Check on-page SEO factors"""
        issues = []
        score = 100
        verified = crawl_data.get("verified_content", True)
        verified = crawl_data.get("verified_content", True)
        
        # Title Check (Always required, search fallback should have got it)
        title = crawl_data.get("title")
        if not title:
            issues.append({
                "severity": "critical", 
                "title": "Missing title tag",
                "description": "Page has no title", 
                "category": "on_page",
                "recommendation": "Add a descriptive <title> tag within the <head> section of your HTML.",
                "fix": f"<title>{url.split('/')[-1] or 'Home'} | Site Name</title>"
            })
            score -= 20
        elif len(title) > 60:
            issues.append({
                "severity": "warning", 
                "title": "Title too long",
                "description": f"Title is {len(title)} chars (max 60)", 
                "category": "on_page",
                "recommendation": "Shorten your title to under 60 characters to ensure it displays correctly in SERPs.",
                "fix": f"<title>{title[:57]}...</title>"
            })
            score -= 5
        
        # Meta Description Check (Always required, search fallback should have got it)
        meta_desc = crawl_data.get("meta_description")
        if not meta_desc:
            issues.append({
                "severity": "critical", 
                "title": "Missing meta description",
                "description": "Page has no meta description", 
                "category": "on_page",
                "recommendation": "Add a <meta name='description'> tag to provide a summary of the page content.",
                "fix": '<meta name="description" content="Enter a brief summary of your page here (approx 150-160 characters).">'
            })
            score -= 15
        
        # H1 Check (Depends on verified_content)
        h1s = crawl_data.get("h1_tags", [])
        if not h1s:
            if verified:
                issues.append({
                    "severity": "critical", 
                    "title": "Missing H1 tag",
                    "description": "Page has no H1 tag which is critical for hierarchy", 
                    "category": "on_page",
                    "recommendation": "Ensure each page has exactly one <h1> tag containing its main topic.",
                    "fix_available": True
                })
                score -= 15
            else:
                issues.append({
                    "severity": "warning",
                    "title": "H1 tag unverifiable",
                    "description": "Could not verify H1 tag due to bot protection on this site.",
                    "category": "on_page",
                    "recommendation": "The site is blocking our crawler. Manually verify that an H1 tag exists.",
                    "fix_available": False
                })
                score -= 5 # Minor penalty for non-transparency
        elif len(h1s) > 1:
            issues.append({
                "severity": "warning", 
                "title": "Multiple H1 tags",
                "description": f"Found {len(h1s)} H1 tags", 
                "category": "on_page",
                "recommendation": "Use only one <h1> tag per page for best SEO results.",
                "fix_available": True
            })
            score -= 5
            
        # Links and Images
        if verified:
            if crawl_data.get("links", 0) == 0:
                issues.append({
                    "severity": "warning",
                    "title": "No internal/external links",
                    "description": "No links found on the page",
                    "category": "on_page",
                    "recommendation": "Add internal and external links to improve site architecture and authority."
                })
                score -= 5
        else:
            # If not verified, we don't know link count, so add info
            issues.append({
                "severity": "info",
                "title": "Incomplete page crawl",
                "description": "Bot protection limited our ability to count links and images.",
                "category": "on_page",
                "recommendation": "Use a premium proxy or Firecrawl API for full visibility."
            })
        
        return {
            "score": max(0, score), 
            "issues": issues, 
            "title": title,
            "meta_description": meta_desc,
            "h1_tags": h1s,
            "blocked": not verified
        }
    async def _check_performance(self, url: str) -> Dict[str, Any]:
        """Check performance using PageSpeed Insights API via ExternalAPIService"""
        metrics = await external_apis.get_pagespeed_metrics(url)
        
        if not metrics:
            return {
                "score": 75,
                "issues": [{
                    "severity": "info",
                    "title": "PageSpeed data unavailable",
                    "description": "Could not fetch real-time performance metrics.",
                    "category": "performance",
                    "recommendation": "Configure PAGESPEED_API_KEY for real-time Core Web Vitals data."
                }]
            }
            
        return {
            "score": metrics.get("performance", 75),
            "vitals": metrics.get("vitals", {}),
            "accessibility_score": metrics.get("accessibility", 0),
            "best_practices_score": metrics.get("best_practices", 0),
            "issues": [] if metrics.get("performance", 0) > 80 else [{
                "severity": "warning",
                "title": "Poor performance detected",
                "description": f"Site scored {int(metrics.get('performance', 0))}% in Google PageSpeed.",
                "category": "performance",
                "recommendation": "Review Core Web Vitals and optimize image sizes and JavaScript execution."
            }]
        }

    async def _check_business_intel(self, url: str) -> Dict[str, Any]:
        """Fetch business intelligence: Tech stack, History, and Security"""
        tech_stack, history, security = await asyncio.gather(
            external_apis.get_tech_stack(url),
            external_apis.get_wayback_history(url),
            external_apis.check_security_headers(url)
        )
        
        return {
            "tech_stack": tech_stack,
            "domain_history": history,
            "security": security
        }
    
    async def _validate_schema(self, url: str, crawl_data: Dict) -> Dict[str, Any]:
        """Validate schema markup"""
        issues = []
        score = 100
        html = crawl_data.get("html", "")
        
        if "application/ld+json" not in html:
            issues.append({
                "severity": "warning", 
                "title": "No JSON-LD schema",
                "description": "Consider adding structured data", 
                "category": "schema",
                "recommendation": "Implement JSON-LD structured data to help search engines understand your content better.",
                "fix": f'<script type="application/ld+json">\n{{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "{crawl_data.get("title") or ""}"\n}}\n</script>'
            })
            score -= 15
        
        return {"score": max(0, score), "issues": issues, "has_schema": "application/ld+json" in html}
    
    async def analyze_page(self, url: str) -> Dict[str, Any]:
        """Analyze a single page"""
        crawl_data = await self._basic_crawl(url)
        return {
            "url": url,
            "title": crawl_data.get("title"),
            "meta_description": crawl_data.get("meta_description"),
            "h1_tags": crawl_data.get("h1_tags", []),
            "word_count": len(crawl_data.get("html", "").split()),
            "images_count": crawl_data.get("images", 0),
            "links_count": crawl_data.get("links", 0)
        }


    async def explain_issue(self, issue: Dict[str, Any], url: str) -> Dict[str, Any]:
        """Use AI to provide a deep dive explanation and fix for an SEO issue"""
        if not self.client:
            return {
                "explanation": "AI explanation service is currently unavailable.",
                "fix_steps": ["Check your site for standard SEO practices."],
                "code_snippet": None
            }
        
        prompt = f"""You are a senior SEO Engineer. Analyze this issue found on {url}:
        
Issue: {issue.get('title')}
Description: {issue.get('description')}
Category: {issue.get('category')}
Severity: {issue.get('severity')}

Provide a detailed "How to Fix" guide.
Return JSON ONLY:
{{
  "explanation": "Detailed professional explanation of why this matters and how it affects SEO.",
  "fix_steps": ["Step 1...", "Step 2..."],
  "code_snippet": "Actual code snippet or config change to fix it (if applicable)",
  "impact_score": <percentage-number 0-100 indicating ranking boost potential>
}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You provide expert SEO implementation plans in JSON format."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            return extract_json(content)
        except Exception as e:
            logger.error(f"Error explaining issue with AI: {e}")
            return {
                "explanation": f"Failed to generate AI explanation: {str(e)}",
                "fix_steps": ["Manual review required."],
                "code_snippet": issue.get('fix')
            }


    def _merge_results(self, fc_data: Dict, basic_data: Dict) -> Dict:
        """Merge results from Firecrawl and Basic crawl to get the most accurate data"""
        if not fc_data or (fc_data.get("pages_count") == 0 and not fc_data.get("title")):
            return basic_data
        if not basic_data or (basic_data.get("pages_count") == 0 and not basic_data.get("title")):
            return fc_data
            
        merged = fc_data.copy()
        
        # A result is only truly blocked if BOTH returned blocked status
        merged["blocked"] = fc_data.get("blocked", False) and basic_data.get("blocked", False)
        
        # verified_content means we have the REAL html to check H1, links, images etc.
        merged["verified_content"] = fc_data.get("verified_content", not fc_data.get("blocked", False)) or \
                                   basic_data.get("verified_content", not basic_data.get("blocked", False))
        
        # Prefer longer/more descriptive title/description
        for field in ["title", "meta_description"]:
            fc_val = str(fc_data.get(field) or "")
            basic_val = str(basic_data.get(field) or "")
            if len(basic_val) > len(fc_val):
                merged[field] = basic_data[field]
        
        # If one source got data and it wasn't marked blocked, clear blocked flag
        if (fc_data.get("title") and not fc_data.get("blocked")) or \
           (basic_data.get("title") and not basic_data.get("blocked")):
            merged["blocked"] = False
            merged["verified_content"] = True
        
        # Prefer higher link/image counts (to avoid JS shells)
        for field in ["links", "images"]:
            if basic_data.get(field, 0) > fc_data.get(field, 0):
                merged[field] = basic_data[field]
                
        # Prefer H1s from basic if Firecrawl missed them
        if not merged.get("h1_tags") and basic_data.get("h1_tags"):
            merged["h1_tags"] = basic_data["h1_tags"]
            
        merged["data_source"] = "firecrawl" if fc_data.get("data_source") == "firecrawl" else "basic"
        return merged

seo_auditor_service = SEOAuditorService()
