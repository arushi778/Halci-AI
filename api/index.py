import sys
import os
from pathlib import Path

# Add the project root and backend directory to sys.path for relative imports
root_path = Path(__file__).parent.parent
sys.path.append(str(root_path))
sys.path.append(str(root_path / "backend"))

# Import the FastAPI app from backend/main.py
from backend.main import app
