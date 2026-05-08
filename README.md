# Legitimate Term Sheet Validation Using AI

An enterprise AI-powered term sheet validation platform built with Django REST Framework, React/Vite, PostgreSQL, ChromaDB, OCR, and retrieval-assisted chatbot workflows.

## Features

- Secure JWT authentication with role-based access control
- Upload PDF, DOCX, Excel, and image term sheets
- OCR extraction and semantic clause parsing
- AI-powered validation and anomaly detection
- ChromaDB-based RAG chatbot
- Dashboard analytics, audit logging, and report export
- Local development without Docker

## Folder Structure

- `backend/` - Django REST backend with database models, AI pipelines, and REST APIs
- `frontend/` - React + Vite UI with Tailwind CSS and Recharts
- `backend/ai_engine/` - OCR, embeddings, and ChromaDB retrieval helpers
- `media/` - Uploaded term sheet storage
- `reports/` - Generated validation reports
- `sample_data/` - Sample files for upload and validation smoke tests

## Prerequisites

- Python 3.12
- PostgreSQL 18 or compatible local PostgreSQL
- Node 20+ for frontend development
- Optional Tesseract OCR executable for image-only OCR

## Quick Start

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Install backend dependencies:

   ```bash
   .\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
   ```

3. Create database objects if needed:

   ```bash
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h 127.0.0.1 -U postgres -d postgres -c "CREATE ROLE legit_user WITH LOGIN PASSWORD 'legit_pass';"
   "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -h 127.0.0.1 -U postgres -O legit_user legit_terms
   ```

4. Apply migrations and create an admin:

   ```bash
   cd backend
   ..\.venv\Scripts\python.exe manage.py migrate
   ..\.venv\Scripts\python.exe manage.py createsuperuser
   ```

5. Start the backend:

   ```bash
   ..\.venv\Scripts\python.exe manage.py runserver
   ```

6. Start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

7. Access the application:

   - Frontend: `http://localhost:4173`
   - Backend API: `http://localhost:8000/api`
   - Health check: `http://localhost:8000/api/health/`

8. Admin login:

   - Username: `admin`
   - Password: `admin123`

## Local Development

### Backend

```bash
cd backend
..\.venv\Scripts\python.exe manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Documentation

See `docs/API.md` for endpoint details.

## Notes

- The backend integrates OCR and semantic extraction using Tesseract, PyMuPDF, pdfplumber, pandas, and sentence-transformers.
- ChromaDB is configured for retrieval-augmented generation and can be extended with domain-specific vector embeddings.
- If a local LLM is not enabled, chatbot responses use retrieved validation context with deterministic fallback language.
