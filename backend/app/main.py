import pathlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.api.v1.health import router as health_router
from app.api.v1.analysis import router as analysis_router
from app.api.v1.rfps import router as rfp_router
from app.api.v1.requirements import router as requirements_router
from app.api.v1.reports import router as reports_router
from app.api.v1.customers import router as customers_router
from app.api.v1.settings import router as settings_router
from app.api.v1.auth import router as auth_router

# Initialize application logging
setup_logging()
logger = get_logger("main")

app = FastAPI(
    title="BidWise AI — Analysis Service",
    description="Sprint 1: Re-architected RFP upload -> extraction -> executive summary",
    version="0.2.0",
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register v1 domain API routers
app.include_router(health_router, prefix="/api/v1", tags=["Health"])
app.include_router(analysis_router, prefix="/api/v1", tags=["Analysis"])
app.include_router(rfp_router, prefix="/api/v1")
app.include_router(requirements_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(customers_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")

# Register backward compatible root routes for the static dashboard & simple tests
app.include_router(health_router, tags=["Root Health"])
app.include_router(analysis_router, tags=["Root Analysis"])


@app.get("/", response_class=HTMLResponse)
def read_root() -> HTMLResponse:
    """Serve the single-page RFP Analyzer dashboard UI."""
    root_path = pathlib.Path(__file__).parent / "index.html"
    try:
        with open(root_path, "r", encoding="utf-8") as f:
            html_content = f.read()
        return HTMLResponse(content=html_content)
    except Exception as e:
        logger.error("Failed to read index.html: %s", e)
        return HTMLResponse(
            content=f"<h1>Error loading UI</h1><p>{str(e)}</p>",
            status_code=500,
        )
