# Quick Start Guide

## Starting the Application

### 1. Start Backend Server

```bash
cd backend
python run.py
```

The backend will start on `http://localhost:8000`

### 2. Start Frontend Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is taken)

## Creating Your First User

Since there's no default user, you need to register one:

### Option 1: Register via Frontend (Recommended)

1. Open `http://localhost:5173` in your browser
2. Click "Sign up" or navigate to `/register`
3. Fill in the registration form:
   - Username: `admin` (or any username)
   - Email: `admin@example.com`
   - Password: Must be at least 8 characters with uppercase, lowercase, and number
   - Full Name: (optional)
4. Click "Create Account"
5. You'll be redirected to login - use your credentials

### Option 2: Register via API

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin123!",
    "full_name": "Administrator"
  }'
```

Then login at `http://localhost:5173/login` with:
- Username: `admin`
- Password: `Admin123!`

### Option 3: Create Default User Script

If you have backend dependencies installed:

```bash
cd backend
python scripts/create_default_user.py
```

This creates:
- Username: `admin`
- Password: `admin123`
- Email: `admin@verifai.local`

⚠️ **Warning**: Change the default password immediately in production!

## Troubleshooting

### Backend won't start

1. Check if port 8000 is already in use:
   ```bash
   netstat -ano | findstr :8000
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Check database is initialized:
   ```bash
   cd backend
   alembic upgrade head
   ```

### Frontend won't start

1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Check if port 5173 is available or use a different port:
   ```bash
   npm run dev -- --port 3000
   ```

### "Invalid credentials" error

- Make sure you've registered a user first (see above)
- Check username and password are correct
- Verify backend is running on port 8000
- Check browser console for API errors

## Next Steps

Once logged in:
1. Create a new scan from the Dashboard
2. Select your LLM model and scanner type (Built-in, Garak, Counterfit, or ART)
3. Run security probes against your model
4. View results and compliance mappings

