# BidWise AI — RFP Analysis Service

BidWise AI is a high-performance analysis service designed to streamline the RFP (Request for Proposal), RFQ, and Tender review process for Bid Managers. It extracts clean, structured text from documents, identifies critical requirements and evaluation criteria, maps out deadlines, flags key risks, and presents them in a beautiful web dashboard.

---

## Features Completed
1. **Multi-format Extraction (F1)**: Handles `.pdf` (retaining page markers using `PyMuPDF`) and `.docx` (retaining paragraphs and tables using `python-docx`).
2. **Gemini 2.5 Analysis (F2)**: Uses the Gemini 2.5 Flash model with custom JSON schema structures to generate a clean, validation-safe executive summary.
3. **Interactive Web Dashboard**: A modern, single-page client interface built with vanilla CSS glassmorphism, drag-and-drop file upload, real-time simulated progress states, and tabbed result visualization.

---

## Installation & Setup

### Prerequisites
- Python 3.12
- A Google Gemini API Key (obtainable from [Google AI Studio](https://aistudio.google.com/))

### 1. Clone & Navigate to Project
Open your terminal (PowerShell, Command Prompt, or Bash) and navigate to the project directory:
```bash
cd D:\Coding\AI_Business\RFP-Project
```

### 2. Set Up a Virtual Environment
Create and activate a Python virtual environment to manage dependencies cleanly:

**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
Install all required libraries specified in `requirements.txt`:
```bash
pip install -r requirements.txt
```

The service relies on the following key packages:
- `fastapi` & `uvicorn[standard]` - High-performance web framework and server
- `python-multipart` - Form-data file uploads support
- `pymupdf` - PDF text and page parsing
- `python-docx` - DOCX text and table parsing
- `google-genai` - Official Google GenAI SDK
- `python-dotenv` - Environment configuration

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Gemini API Key:

```ini
# .env file
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

---

## Running the Application

Start the FastAPI local development server using `uvicorn`:
```bash
uvicorn app.main:app --reload --port 8000
```

Once running:
- **Web UI Dashboard**: Access [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your web browser.
- **Interactive Swagger Docs**: Go to [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) to test API endpoints directly.
- **Service Health Check**: Endpoint at [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health).

---

## Code Architecture & Components

```
RFP-Project/
├── app/
│   ├── __init__.py
│   ├── extractor.py    # Document text extraction layer (PDF/DOCX)
│   ├── index.html      # Glassmorphic single-page web interface
│   ├── main.py         # FastAPI routes, middlewares, and startup
│   └── summarizer.py   # Gemini API integration and custom schema matching
├── .env                # Local secrets configuration (ignored in git)
├── requirements.txt    # Dependency definitions
├── sample_rfp.docx     # Test document (DOCX format)
└── sample_rfp.pdf      # Test document (PDF format)
```

### 1. Document Extraction (`app/extractor.py`)
- Dispatches parsing based on file extension.
- **PDF Extraction**: Uses `PyMuPDF` (`fitz`) to extract text page-by-page. Formats output with page markers (e.g., `--- Page 1 ---`) to allow Gemini to contextualize references.
- **DOCX Extraction**: Uses `python-docx` to iterate through paragraphs and extract tabular grid content, joining cells with a pipe character (`|`) to maintain structure.
- Cleans and normalizes whitespace runs while preserving paragraph spacing.

### 2. Executive Summary Engine (`app/summarizer.py`)
- Defines the `ExecutiveSummary` structure.
- **Gemini API Integration**: Implements the official `google-genai` SDK Client.
- **Custom Schema Workaround**: Nested Pydantic schemas in Pydantic v2 serialize with `$defs` and `$ref` keywords, which are rejected by the Gemini API schema validator. To solve this, a flat, explicit schema dictionary is defined and passed to `response_schema` in the SDK, ensuring stable structured JSON responses:
  ```python
  EXECUTIVE_SUMMARY_SCHEMA = {
      "type": "OBJECT",
      "properties": {
          "project_overview": {"type": "STRING", "description": "..."},
          "key_requirements": {"type": "ARRAY", "items": {"type": "STRING"}},
          "deadlines": {
              "type": "ARRAY",
              "items": {
                  "type": "OBJECT",
                  "properties": {
                      "label": {"type": "STRING"},
                      "date_or_detail": {"type": "STRING"}
                  },
                  "required": ["label", "date_or_detail"]
              }
          },
          # ... other fields
      }
  }
  ```

### 3. FastAPI Server Gateway (`app/main.py`)
- Configures CORS permissions to allow connection from external frontends.
- Defines `/health` check.
- Serve the interactive HTML dashboard on the `/` route dynamically.
- Implements `/analyze` (POST) which reads file bytes, enforces a 25MB safety limit, processes text extraction, calls the Gemini Summarizer, and returns structured metadata + analysis results.

### 4. Interactive Dashboard (`app/index.html`)
- **Aesthetic**: Premium dark gradient background with glassmorphism layout containers.
- **Upload**: Interactive drag-and-drop or file selector with instant feedback.
- **Loading Indicators**: Multi-phase loading status messages simulating progress through the analysis steps.
- **Result Panels**: Tabbed navigation between:
  - **Dashboard View**: Clean structured cards displaying project metadata, Project Overview, Key Requirements with icons, Evaluation Criteria, Critical Deadlines table, and a dedicated, warn-colored alert section for Important Risks.
  - **Raw JSON**: High-fidelity JSON view with a copy-to-clipboard function.

---

## Local Verification & Testing

### Test Option A: Web Interface (Recommended)
1. Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your browser.
2. Drag and drop the `sample_rfp.docx` or `sample_rfp.pdf` file into the upload zone (or click to browse).
3. Watch the progress animation load the analysis.
4. Interact with the Dashboard View tabs and copy the raw JSON as needed.

### Test Option B: CLI Curl Command
You can test the endpoint directly using `curl` from a terminal window:

```bash
# Test using the sample DOCX file
curl -F "file=@sample_rfp.docx" http://127.0.0.1:8000/analyze
```

**Example Successful Output:**
```json
{
  "filename": "sample_rfp.docx",
  "file_type": "docx",
  "page_count": 0,
  "char_count": 1117,
  "processing_time_seconds": 4.01,
  "executive_summary": {
    "project_overview": "The City of Riverdale is seeking a qualified vendor to migrate its legacy on-premise data center to a secure, scalable cloud infrastructure...",
    "key_requirements": [
      "Vendor must hold ISO 27001 certification",
      "Minimum 5 years experience with government cloud migrations",
      "24/7 support SLA with 1-hour critical response time"
    ],
    "deadlines": [
      { "label": "Proposal Submission Deadline", "date_or_detail": "July 20, 2026" }
    ],
    "evaluation_criteria": [
      "Technical approach: 40%",
      "Cost: 30%"
    ],
    "important_risks": [
      "Submission deadline is firm with no extensions."
    ],
    "issuing_organization": "City of Riverdale Municipal Corporation"
  }
}
```
