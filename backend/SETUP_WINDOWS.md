# Backend Setup for Windows

## Problem
Python 3.15.0a2 (alpha) is not compatible with pydantic-core which requires Rust compilation. The backend needs Python 3.10-3.13.

## Solution: Use Python 3.13

### Step 1: Install Python 3.13

1. Download Python 3.13 from: https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Verify installation:
   ```powershell
   py -3.13 --version
   ```

### Step 2: Create Virtual Environment

```powershell
cd backend
py -3.13 -m venv venv
.\venv\Scripts\activate
```

You should see `(venv)` in your prompt.

### Step 3: Install Dependencies

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Start Backend

```powershell
python run.py
```

You should see:
```
==================================================
  verifAI - LLM Security Scanner Backend
==================================================

INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Step 5: Verify Backend is Running

In a new terminal:
```powershell
curl http://localhost:8000/api/v1/health
```

Or open in browser: http://localhost:8000/api/docs

## Alternative: Use Python 3.12 or 3.11

If you have Python 3.12 or 3.11 installed:

```powershell
cd backend
py -3.12 -m venv venv    # or py -3.11
.\venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
python run.py
```

## Troubleshooting

### "py -3.13" not found
- Make sure Python 3.13 is installed
- Try `python3.13` or `python3` instead
- Check PATH: `where python`

### Port 8000 already in use
```powershell
# Find process using port 8000
Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess

# Kill it (replace PID with actual process ID)
Stop-Process -Id <PID> -Force
```

### Still getting pydantic errors
1. Make sure virtual environment is activated (you see `(venv)`)
2. Reinstall dependencies:
   ```powershell
   pip uninstall pydantic pydantic-settings fastapi -y
   pip install -r requirements.txt
   ```

