import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
REPORT_DIR = DATA_DIR / "reports"
SAMPLES_DIR = DATA_DIR / "samples"

for d in [DATA_DIR, UPLOAD_DIR, REPORT_DIR, SAMPLES_DIR]:
    d.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/cerberus.db")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:latest")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".txt", ".jpg", ".jpeg", ".png", ".webp",
    ".csv", ".xlsx", ".xls", ".json", ".sqlite", ".db", ".sql"
}
