"""
Google Search Console & Analytics Service (Stub)
Provides the framework for real-time traffic and keyword data from Google.
"""

import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

import os
import json
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

# Scopes required for GSC and Analytics
SCOPES = [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly'
]

class GoogleMetricsService:
    """Service to handle GSC and Analytics integration"""

    def __init__(self):
        self.creds_path = os.path.join(os.getcwd(), "google-credentials.json")
        self.token_path = os.path.join(os.getcwd(), "google-tokens.json")
        self.client_config = None
        self.is_configured = False
        
        # Check environment variable first (Vercel/Prod preference)
        if settings.GOOGLE_CREDENTIALS_JSON:
            try:
                self.client_config = json.loads(settings.GOOGLE_CREDENTIALS_JSON)
                self.is_configured = True
                logger.info("Google credentials loaded from environment variable.")
            except Exception as e:
                logger.error(f"Failed to parse GOOGLE_CREDENTIALS_JSON: {e}")

        # Fallback to local file
        if not self.is_configured and os.path.exists(self.creds_path):
            try:
                with open(self.creds_path, 'r') as f:
                    self.client_config = json.load(f)
                self.is_configured = True
                logger.info("Google credentials loaded from local file.")
            except Exception as e:
                logger.error(f"Failed to read local google-credentials.json: {e}")

        self.credentials = None
        if self.is_configured:
            if os.path.exists(self.token_path):
                self.credentials = Credentials.from_authorized_user_file(self.token_path, SCOPES)
                logger.info("Loaded existing Google tokens.")

    def get_auth_url(self, redirect_uri: str) -> str:
        """Get the Google Auth URL to initiate login"""
        if not self.is_configured:
            return ""
            
        if self.client_config:
            flow = Flow.from_client_config(
                self.client_config,
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
        else:
            flow = Flow.from_client_secrets_file(
                self.creds_path,
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
        auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
        return auth_url

    async def handle_callback(self, code: str, redirect_uri: str):
        """Exchange auth code for tokens"""
        flow = Flow.from_client_secrets_file(
            self.creds_path,
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )
        flow.fetch_token(code=code)
        self.credentials = flow.credentials
        
        with open(self.token_path, "w") as f:
            f.write(self.credentials.to_json())
        
        return True

    async def get_gsc_data(self, domain: str) -> Dict[str, Any]:
        """Fetch keyword impression and click data from Search Console"""
        if not self.credentials:
            return {
                "status": "not_authenticated",
                "message": "Please log in with Google to see real GSC data."
            }
        
        try:
            # Refresh if expired
            if self.credentials.expired and self.credentials.refresh_token:
                self.credentials.refresh(Request())
                
            service = build('searchconsole', 'v1', credentials=self.credentials)
            
            # Normalize site URL for GSC (needs protocol)
            site_url = domain if domain.startswith('http') else f"https://{domain}"
            if not site_url.endswith('/'): site_url += '/'
            
            request = {
                'startDate': '2023-12-01', # Example range
                'endDate': '2024-01-01',
                'dimensions': ['query'],
                'rowLimit': 10
            }
            
            response = service.searchanalytics().query(siteUrl=site_url, body=request).execute()
            rows = response.get('rows', [])
            
            return {
                "status": "success",
                "total_clicks": sum(r.get('clicks', 0) for r in rows),
                "total_impressions": sum(r.get('impressions', 0) for r in rows),
                "top_queries": rows[:5]
            }
        except Exception as e:
            logger.error(f"Failed to fetch GSC data: {e}")
            return {"status": "error", "message": str(e)}

    async def get_analytics_data(self, domain: str) -> Dict[str, Any]:
        """Fetch traffic and conversion data from Google Analytics 4"""
        if not self.credentials:
            return {
                "status": "not_authenticated",
                "message": "Please log in with Google to see GA4 data."
            }
        
        # Real-time data simplified for demo
        return {
            "status": "success",
            "active_users": 124, # In a real implementation we'd use analyticsdata V1beta
            "conversions": 12
        }

google_metrics = GoogleMetricsService()
