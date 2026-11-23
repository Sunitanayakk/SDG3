import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from app.api.routes import router
from app.core.config import settings
from app.database.seed import seed
from app.database.session import Base, SessionLocal, engine

logging.basicConfig(level=logging.WARNING)


@asynccontextmanager
async def lifespan(app):
    if settings().demo_mode:
        Base.metadata.create_all(engine)
        with SessionLocal() as db:
            seed(db)
    yield


app = FastAPI(
    title="SwasthyaSetu AI",
    version="1.0.0",
    lifespan=lifespan,
    description="Healthcare education prototype. No diagnosis or treatment. Synthetic Demo Mode available.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings().cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def secure_headers(request: Request, call_next):
    try:
        if int(request.headers.get("content-length", "0")) > settings().max_upload_bytes + 65536:
            return JSONResponse(
                {"error": {"code": 413, "message": "Request exceeds upload limit"}}, status_code=413
            )
    except ValueError:
        return JSONResponse({"error": {"code": 400, "message": "Invalid content length"}}, status_code=400)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(HTTPException)
async def http_error(request, exc):
    return JSONResponse(
        {"error": {"code": exc.status_code, "message": str(exc.detail)}},
        status_code=exc.status_code,
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_error(request, exc):
    return JSONResponse(
        {"error": {"code": 422, "message": "Invalid request. Check required fields, formats and limits."}},
        status_code=422,
    )


@app.exception_handler(Exception)
async def unexpected_error(request, exc):
    # Deliberately omit request bodies, SQL parameters and raw exception strings.
    logging.getLogger("setu").error("Unhandled request failure: %s", type(exc).__name__)
    return JSONResponse(
        {"error": {"code": 500, "message": "An internal error occurred. Please retry."}}, status_code=500
    )


app.include_router(router)
