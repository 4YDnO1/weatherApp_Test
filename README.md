# Weather App (Laravel + React + PostgreSQL)

Dockerized test app for viewing weather readings.

## Stack
- Backend: Laravel 10 (PHP 8.2), PostgreSQL
- Frontend: React + Vite + TypeScript + Recharts

## Prerequisites
- Docker Desktop
- Git
- Optional: GitHub CLI (`gh`) for repo creation

## Run locally
```bash
# Build images
docker compose build

# Start
docker compose up -d

# Open
# Frontend: http://localhost:5173
# API:      http://localhost:8000/api
```

## API
- GET `/api/weather/last` — last closest
- GET `/api/weather/recent` — 50 recent weather marks (hours)
- GET `/api/weather/range?from=YYYY-MM-DD&to=YYYY-MM-DD` — by date range
Also need provide latitude (?lat=) and longitude (?lon=)

## GitHub (private)
```bash
# Initialize repo
git init
git add .
git commit -m "Initial commit: dockerized Laravel + React weather app"

# Create private repo (requires gh auth)
# gh auth login
gh repo create <your-org-or-user>/<repo-name> --private --source=. --remote=origin --push

# If not using gh, create repo on GitHub and then
# git remote add origin git@github.com:<user>/<repo>.git
# git branch -M main
# git push -u origin main
``` 