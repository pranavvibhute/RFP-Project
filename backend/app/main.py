import pathlib
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse

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

# Auth middleware - protects all routes except exempt paths
EXEMPT_PATHS = {
    "/",
    "/docs",
    "/openapi.json",
    "/api/v1/auth/register",
    "/api/v1/auth/login",
    "/api/v1/auth/me",
    "/api/v1/health",
    "/health",
    "/favicon.ico",
    "/api/v1/analyze",
    "/analyze",
    "/api/v1/risks",
    "/api/v1/analysis/metrics",
}


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Preflight OPTIONS requests for CORS must not be challenged for authentication
    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path
    if path in EXEMPT_PATHS or path.startswith("/static") or path.startswith("/reports/"):
        return await call_next(request)

    # Check Authorization header first (for API calls)
    auth_header = request.headers.get("authorization")
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    else:
        # Fallback: check auth_token cookie (for page navigations)
        cookie_token = request.cookies.get("auth_token")
        if cookie_token:
            token = cookie_token

    if not token:
        response = JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Not authenticated"},
        )
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        return response

    from app.core.security import decode_token
    payload = decode_token(token)
    if payload is None:
        response = JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid or expired token"},
        )
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        return response

    request.state.user = payload
    return await call_next(request)


# CORS middleware - registered AFTER auth_middleware so it wraps it as the outermost layer!
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.2:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
