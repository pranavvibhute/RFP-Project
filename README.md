# BidWise AI — Enterprise RFP Analysis & Proposal Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.139-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-red.svg)](https://qdrant.tech/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-orange.svg)](https://aistudio.google.com/)

**BidWise AI** is an enterprise-grade AI-powered Request for Proposal (RFP), RFQ, and Tender analysis platform. Built for Bid Managers, Proposal Leads, and Solution Architects, BidWise AI automatically ingests complex bid documents, extracts structured data, identifies key requirements and evaluation criteria, evaluates risk factors, and leverages Retrieval-Augmented Generation (RAG) vector search to accelerate proposal response workflows.

---

## 🌟 Key Features

### 📄 Multi-Format Document Ingestion & Parsing
- **PDF Extraction (`PyMuPDF`)**: Pages are parsed with explicit page markers (e.g., `--- Page N ---`), enabling precise citation mapping back to original source documents.
- **DOCX Extraction (`python-docx`)**: Extracts structured paragraph text and tabular content, preserving grid structures by converting table cells into delimited format.
- **Large Document Processing**: Handles large documents up to 25MB with chunking and token safety limits.

### 🤖 Dual-Engine AI & RAG Intelligence
- **Google Gemini 2.5 Flash Integration**: Rapid structured JSON extraction with validated schemas for executive summaries, requirement lists, deadlines, and risk factors.
- **Qwen / OpenRouter Support**: Secondary LLM integration with automatic confidence-scoring failover fallback.
- **Vector Search RAG Pipeline**: Built-in text chunking (1400 chars, 200 overlap), `BAAI/bge-large-en-v1.5` embeddings, and high-performance vector retrieval via **Qdrant**.
- **Q&A Context Engine**: Question answering grounded in uploaded RFP document chunks.

### 📊 Modern Next.js 16 Executive Dashboard
- **Analytics & Revenue Metrics**: Tracks active RFPs, win/loss conversion rates, total revenue bookings, and compliance review session stats.
- **Drag-and-Drop Analysis Portal**: Upload documents directly with step-by-step progress tracking (extraction -> chunking -> vector indexing -> AI evaluation).
- **Tabbed Interactive Results**: View project overview, key requirements table, deadline timeline, evaluation criteria percentages, and color-coded risk alerts.
- **Raw JSON Export**: Copy or download schema-validated analysis outputs.

### 📋 Requirements & Risk Management
- **Requirement Extraction**: Automatically flags mandatory vs. optional technical, security, and operational requirements.
- **Risk Severity Engine**: Highlights firm submission deadlines, SLA penalties, missing compliance certifications, and scope ambiguities.
- **Compliance Matrix**: Track requirement fulfillment status across teams.

### 🏢 Organization & Multi-Tenant Management
- **Customer Directory**: Manage client accounts, organizational profiles, and historical RFPs.
- **Settings & Model Switcher**: Live dynamic configuration of primary/fallback AI providers, API keys, confidence thresholds, and vector store parameters.

---

## 🏗️ Architecture & Tech Stack

```
                                  ┌────────────────────────┐
                                  │   Next.js 16 Frontend  │
                                  │ (TypeScript, Tailwind) │
                                  └───────────┬────────────┘
                                              │ REST API
                                              ▼
                                  ┌────────────────────────┐
                                  │   FastAPI Backend Gateway │
                                  └───────────┬────────────┘
                                              │
               ┌──────────────────────────────┼──────────────────────────────┐
               ▼                              ▼                              ▼
    ┌────────────────────┐        ┌────────────────────┐        ┌────────────────────┐
    │ Document Engine    │        │  AI Intelligence   │        │ Data Storage Layer │
    │ (PyMuPDF, docx)    │        │ (Gemini 2.5, Qwen) │        │ (SQLAlchemy, DB)   │
    └────────────────────┘        └───────────┬────────┘        └────────────────────┘
                                              │ Embeddings & RAG
                                              ▼
                                  ┌────────────────────────┐
                                  │  Qdrant Vector Engine  │
                                  └────────────────────────┘
```

| Component | Stack / Technologies |
| :--- | :--- |
| **Frontend UI** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts |
| **Backend Framework** | Python 3.12, FastAPI 0.139, Uvicorn, Pydantic v2, Pydantic Settings |
| **Database & ORM** | SQLAlchemy 2.0, Alembic (Database Migrations), PostgreSQL / SQLite |
| **AI Models & SDKs** | Google GenAI SDK (`google-genai`), OpenRouter (Qwen-3 Instruct), HuggingFace (`BAAI/bge-large-en-v1.5`) |
| **Vector Store** | Qdrant (`qdrant-client`), Docker Compose |
| **Document Processing** | PyMuPDF (`fitz`), `python-docx`, `lxml` |
| **Testing & Quality** | `pytest`, custom evaluation scripts |

---

## 📁 Workspace Directory Structure

```
RFP-Project/
├── docker-compose.yml           # Local Qdrant Vector Database service definition
├── README.md                    # Project documentation
│
├── backend/                     # FastAPI Backend Core
│   ├── alembic/                 # Database schema migration scripts
│   ├── app/
│   │   ├── api/v1/              # Versioned API REST Routers
│   │   │   ├── analysis.py      # Document upload, extraction & RAG endpoints
│   │   │   ├── auth.py          # User authentication endpoints
│   │   │   ├── customers.py     # Organization & client management
│   │   │   ├── health.py        # System status & diagnostic checks
│   │   │   ├── reports.py       # Analytics, compliance & revenue reports
│   │   │   ├── requirements.py  # Extracted RFP requirement endpoints
│   │   │   ├── rfps.py          # RFP document CRUD & lifecycle status
│   │   │   └── settings.py      # AI provider & vector config updates
│   │   │
│   │   ├── core/                # Configuration settings & logging setup
│   │   ├── database/            # SQLAlchemy session & base models
│   │   ├── models/              # Database models (RFP, Requirement, Org, User)
│   │   ├── repositories/        # Database access repository pattern
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/            # Core business logic
│   │   │   ├── ai/              # Gemini, Qwen, RAG chunking & vector store
│   │   │   ├── document/        # PDF & DOCX text extraction
│   │   │   └── rfp/             # RFP processing workflows
│   │   └── index.html           # Embedded single-page HTML fallback UI
│   │
│   ├── scripts/                 # Utility & intelligence evaluation scripts
│   │   ├── evaluate_intelligence.py # AI extraction accuracy benchmark
│   │   ├── insert_aicte_rfp.py       # Test data loader
│   │   └── seed.py                   # Initial database seeder
│   │
│   ├── tests/                   # Pytest automated test suites
│   ├── requirements.txt         # Python dependency definitions
│   └── .env.example             # Environment variable template
│
└── frontend/                    # Next.js 16 Modern Web Interface
    ├── prisma/                  # Prisma schema definitions
    ├── public/                  # Static assets & public icons
    └── src/
        ├── app/                 # Next.js App Router Pages
        │   ├── dashboard/       # Executive analytics dashboard
        │   ├── upload/          # Document upload & real-time analysis
        │   ├── rfps/            # RFP document repository & detail views
        │   ├── requirements/    # Interactive requirement matrix tracker
        │   ├── risks/           # Risk assessment portal
        │   ├── reports/         # Executive reporting center
        │   ├── customers/       # Organization & client directory
        │   ├── settings/        # AI & Vector DB settings panel
        │   ├── login/           # Authentication login
        │   └── register/        # User registration
        │
        └── components/          # UI Components
            ├── dashboard/       # Revenue, Win-rate & Session charts
            ├── chat/            # RAG Q&A Assistant interface
            ├── layout/          # Navigation sidebar & header
            └── ui/              # Reusable UI primitives
```

---

## ⚡ Quick Start & Installation Guide

### Prerequisites
- **Python**: `v3.12` or higher
- **Node.js**: `v18.0.0` or higher (with `npm`)
- **Docker**: Docker Desktop installed and running (for Qdrant Vector Store)
- **API Key**: Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))

---

### Step 1: Start Vector Database (Qdrant)
Run Qdrant using Docker Compose from the root directory:

```bash
docker-compose up -d
```
*Qdrant will start on port `6333`.*

---

### Step 2: Set Up & Launch Backend Service

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Create a `.env` file inside `backend/` (or copy `.env.example`):
   ```env
   APP_NAME="BidWise AI"
   APP_VERSION="1.0.0"
   DEBUG=True

   # Database (PostgreSQL or local SQLite fallback)
   DATABASE_URL="sqlite:///./rfp_database.db"

   # AI LLM Provider Configuration
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   GEMINI_MODEL="gemini-2.5-flash"

   # Secondary / Fallback Provider (Optional: OpenRouter Qwen)
   AI_PRIMARY_PROVIDER="qwen"
   AI_FALLBACK_PROVIDER="gemini"
   QWEN_BASE_URL="https://openrouter.ai/api/v1"
   QWEN_API_KEY="your_openrouter_api_key"
   QWEN_MODEL="openrouter/free"

   # Qdrant Vector DB Configuration
   QDRANT_URL="http://localhost:6333"
   QDRANT_COLLECTION="bidwise_rfp_chunks"
   ```

5. **Seed Initial Data (Optional)**:
   ```bash
   python scripts/seed.py
   ```

6. **Start the FastAPI Backend Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - **Backend API Base**: `http://127.0.0.1:8000/`
   - **Interactive OpenAPI Docs**: `http://127.0.0.1:8000/docs`
   - **Health Check**: `http://127.0.0.1:8000/api/v1/health`

---

### Step 3: Set Up & Launch Frontend Client

1. **Open a new terminal and navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node modules**:
   ```bash
   npm install
   ```

3. **Start Next.js development server**:
   ```bash
   npm run dev
   ```
   - **Web UI Dashboard**: Access [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Reference Overview

The FastAPI backend exposes the following primary endpoints under `/api/v1`:

| Category | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **System** | `/health` | `GET` | Service status, database connectivity, and uptime check |
| **Analysis** | `/api/v1/analysis/upload` | `POST` | Ingests `.pdf`/`.docx`, extracts text, chunks vector index, & runs AI analysis |
| **RFP Management** | `/api/v1/rfps` | `GET` | Lists all processed RFPs with filters and status |
| **RFP Detail** | `/api/v1/rfps/{id}` | `GET` | Fetches full RFP details, requirements, risks, and timeline |
| **RFP Status** | `/api/v1/rfps/{id}/status`| `PATCH` | Updates RFP pipeline stage (`draft`, `under_review`, `submitted`, `won`, `lost`) |
| **Requirements**| `/api/v1/requirements` | `GET` | Retrieves extracted requirements matrix with category filters |
| **Reports** | `/api/v1/reports/summary` | `GET` | Aggregated dashboard stats (win rates, revenue, session counts) |
| **Customers** | `/api/v1/customers` | `GET` / `POST` | Manage enterprise customer accounts & profiles |
| **Settings** | `/api/v1/settings/ai` | `GET` / `POST` | Retrieve or update LLM models, API keys & vector search thresholds |
| **Auth** | `/api/v1/auth/login` | `POST` | Authenticate user credentials and return access token |

---

## 🧪 Testing & Verification

### Running Automated Unit & Integration Tests
Run pytest from within the `backend/` directory:

```bash
cd backend
pytest -v
```

### Running AI Intelligence Evaluation
Assess the document extraction and AI summarization quality:

```bash
cd backend
python scripts/evaluate_intelligence.py
```

### Direct CLI Verification via cURL
Test document analysis directly against the API:

```bash
curl -F "file=@sample_rfp.docx" http://127.0.0.1:8000/api/v1/analysis/upload
```

---

## 🛡️ License

This project is proprietary software created for enterprise RFP analysis. All rights reserved.
