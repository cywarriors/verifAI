"""Main FastAPI application"""

from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config.settings import settings
from app.db.session import engine, Base
from app.api import auth, scans, compliance, reports
from app.core.logging_config import setup_logging

# Setup logging
setup_logging()
import logging
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized")
    logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} started")
    print(f"✓ Database initialized")
    print(f"✓ {settings.APP_NAME} v{settings.APP_VERSION} started")
    yield
    # Shutdown
    logger.info("Shutting down...")
    print("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Comprehensive security scanning solution for Large Language Models",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security middleware
from app.core.security_middleware import SecurityHeadersMiddleware, RateLimitMiddleware
app.add_middleware(SecurityHeadersMiddleware)
if not settings.DEBUG:
    app.add_middleware(RateLimitMiddleware, requests_per_minute=60)


# Exception handlers
import logging
logger = logging.getLogger(__name__)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler with detailed logging"""
    import traceback
    
    # Log full error details
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        exc_info=True,
        extra={
            "path": request.url.path,
            "method": request.method,
            "client": request.client.host if request.client else None
        }
    )
    
    # Return appropriate error response
    error_detail = {
        "detail": "Internal server error",
        "type": type(exc).__name__,
    }
    
    if settings.DEBUG:
        error_detail["message"] = str(exc)
        error_detail["traceback"] = traceback.format_exc()
    else:
        error_detail["message"] = "An unexpected error occurred. Please contact support."
        error_detail["error_id"] = f"ERR-{hash(str(exc)) % 1000000:06d}"
    
    return JSONResponse(
        status_code=500,
        content=error_detail
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle validation errors"""
    logger.warning(f"Validation error: {str(exc)}", extra={"path": request.url.path})
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc), "type": "ValidationError"}
    )

@app.exception_handler(PermissionError)
async def permission_error_handler(request: Request, exc: PermissionError):
    """Handle permission errors"""
    logger.warning(f"Permission denied: {str(exc)}", extra={"path": request.url.path})
    return JSONResponse(
        status_code=403,
        content={"detail": str(exc) or "Permission denied", "type": "PermissionError"}
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health_status = {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Add Garak health if available
    try:
        from scanner.garak_integration import GARAK_AVAILABLE
        if GARAK_AVAILABLE:
            from scanner.garak_integration import GarakIntegration
            from scanner.garak_config import GarakConfig
            try:
                garak_config = GarakConfig()
                if garak_config.enabled:
                    garak = GarakIntegration(config=garak_config)
                    health_status["garak"] = garak.get_health()
            except Exception as e:
                health_status["garak"] = {
                    "status": "error",
                    "error": str(e)
                }
    except ImportError:
        pass  # Scanner not available
    
    return health_status


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
        "health": "/health"
    }


# Include API routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Authentication"]
)

app.include_router(
    scans.router,
    prefix=f"{settings.API_V1_STR}/scans",
    tags=["Scans"]
)

app.include_router(
    compliance.router,
    prefix=f"{settings.API_V1_STR}/compliance",
    tags=["Compliance"]
)

app.include_router(
    reports.router,
    prefix=f"{settings.API_V1_STR}/reports",
    tags=["Reports"]
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
