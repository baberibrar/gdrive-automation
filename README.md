# GDrive Automation Platform

A full-stack web application that automates document processing and AI-powered feedback generation from Google Drive files. Upload or browse your Drive files, extract text from various formats, and generate professional feedback using AI.

## Features

- **Google OAuth 2.0 Authentication** - Secure login with Google accounts
- **Google Drive Integration** - Browse, search, and access files directly from Drive
- **Multi-Format Text Extraction** - Supports PDFs, Word docs, images (OCR), Google Docs, Sheets, Presentations, and plain text files
- **AI-Powered Analysis** - Identifies parties, roles, and summarizes document content using OpenAI GPT-4o-mini
- **Feedback Generation** - Creates professional feedback from both freelancer/influencer and client perspectives with star ratings
- **Feedback History** - View and manage all generated feedback entries

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Backend | FastAPI, SQLAlchemy (async), Pydantic v2 |
| Database | SQLite with aiosqlite |
| Auth | Google OAuth 2.0, JWT |
| AI | OpenAI API (GPT-4o-mini) |
| OCR | AWS Textract |
| File Parsing | pdfplumber, python-docx |

## Project Structure

```
gdrive-automation/
├── frontend/                # React + Vite application
│   ├── src/
│   │   ├── pages/           # Page components (Login, Dashboard, Drive, etc.)
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context (AuthContext)
│   │   ├── api/             # Axios API client
│   │   └── App.jsx          # Router & layout
│   ├── package.json
│   └── vite.config.js
│
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── routers/         # API route handlers (auth, drive, extract, feedback)
│   │   ├── services/        # Business logic (google, textract, openai)
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── config.py        # Settings & environment config
│   │   └── database.py      # Database setup
│   ├── main.py              # FastAPI entry point
│   ├── requirements.txt
│   └── .env.example         # Environment variable template
│
└── README.md
```

## Prerequisites

- Python 3.13+
- Node.js 18+
- Google Cloud project with OAuth 2.0 credentials and Drive API enabled
- AWS account with Textract permissions
- OpenAI API key

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/gdrive-automation.git
cd gdrive-automation
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

Create a `.env` file from the template and fill in your credentials:

```bash
cp .env.example .env
```

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/callback
JWT_SECRET=change-this-to-a-random-secret-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
OPENAI_API_KEY=your-openai-api-key
FRONTEND_URL=http://localhost:5173
```

Start the backend server:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/login` | Initiate Google OAuth login |
| `GET` | `/api/auth/callback` | OAuth callback handler |
| `GET` | `/api/auth/me` | Get current user info |
| `GET` | `/api/drive/files` | List Drive files (supports `folder_id` and `q` params) |
| `GET` | `/api/drive/files/{file_id}/download` | Download a file |
| `POST` | `/api/extract/text` | Extract text from a file |
| `POST` | `/api/extract/analyze` | Analyze extracted text for parties/roles |
| `POST` | `/api/extract/generate-feedback` | Generate AI feedback |
| `POST` | `/api/feedback` | Save feedback entry |
| `GET` | `/api/feedback` | List user's feedback history |

## Supported File Formats

| Format | Method |
|--------|--------|
| PDF (`.pdf`) | pdfplumber |
| Word (`.docx`, `.doc`) | python-docx |
| Images (`.png`, `.jpg`, `.jpeg`, `.tiff`, `.bmp`) | AWS Textract OCR |
| Google Docs | Exported as plain text via Drive API |
| Google Sheets | Exported as CSV via Drive API |
| Google Slides | Exported as plain text via Drive API |
| Plain text (`.txt`, `.csv`, `.md`, `.json`, `.xml`, `.html`, `.rtf`) | Direct read |

## License

This project is for personal/educational use.
