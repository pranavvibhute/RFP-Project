"""
main.py
Sprint 1 deliverable: Upload RFP -> Extract Text -> Generate Executive
Summary -> Return structured JSON (Tejas's frontend stores + displays it).

Run locally:
    uvicorn app.main:app --reload --port 8000

Then POST a file to:
    http://localhost:8000/analyze
"""

from __future__ import annotations

import logging
import time

import pathlib
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from app.extractor import (
    EmptyDocumentError,
    UnsupportedFileTypeError,
    extract_text,
)
from app.summarizer import ExecutiveSummary, SummarizationError, generate_executive_summary

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bidwise.main")

app = FastAPI(
    title="BidWise AI — Analysis Service",
    description="Sprint 1: RFP upload -> extraction -> executive summary",
    version="0.1.0",
)

# Wide open for local dev with the Next.js frontend; tighten before any real deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB, matches typical RFP doc sizes


class AnalyzeResponse(BaseModel):
    filename: str
    file_type: str
    page_count: int
    char_count: int
    processing_time_seconds: float
    executive_summary: ExecutiveSummary


@app.get("/", response_class=HTMLResponse)
def read_root() -> HTMLResponse:
    """Serve the single-page RFP Analyzer dashboard."""
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


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "bidwise-analysis"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_rfp(file: UploadFile = File(...)) -> AnalyzeResponse:
    """
    Sprint 1 end-to-end pipeline:
      1. Validate + read uploaded file
      2. Extract text (PDF/DOCX)
      3. Generate structured executive summary via Gemini
      4. Return JSON for the frontend to store + display
    """
    start = time.monotonic()

    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file has no filename.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {MAX_UPLOAD_BYTES // (1024*1024)}MB limit.",
        )

    # --- Step 1: Extraction (F1) ---
    try:
        extraction = extract_text(file_bytes, file.filename)
    except UnsupportedFileTypeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except EmptyDocumentError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    logger.info(
        "Extracted %d chars from %s (%s, %d pages)",
        extraction.char_count, extraction.filename, extraction.file_type, extraction.page_count,
    )

    # --- Step 2: Executive Summary (F2) ---
    try:
        summary = generate_executive_summary(extraction.full_text, filename=extraction.filename)
    except SummarizationError as e:
        logger.error("Summarization failed for %s: %s", extraction.filename, e)
        raise HTTPException(status_code=502, detail=f"AI summarization failed: {e}") from e

    elapsed = time.monotonic() - start
    logger.info("Completed analysis of %s in %.2fs", extraction.filename, elapsed)

    return AnalyzeResponse(
        filename=extraction.filename,
        file_type=extraction.file_type,
        page_count=extraction.page_count,
        char_count=extraction.char_count,
        processing_time_seconds=round(elapsed, 2),
        executive_summary=summary,
    )
