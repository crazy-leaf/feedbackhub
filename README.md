# Feedbackhub

FeedbackFlow is a web application designed to streamline performance feedback within organizations, allowing managers to provide constructive feedback to employees.

## Screenshots

Here's a look at the FeebackHub in action:


## Stack & Key Design Decisions

This project is built as a **monorepo** with a clear separation of concerns, designed for efficient development and deployment.

* **Frontend:**
    * **React.js (with Vite):** Component-based UI development, efficient bundling, and fast development server.

* **Backend:**
    * **FastAPI (Python):** High performance, automatic API documentation, and strong type hinting. It handles all business logic, data persistence, and authentication.
    * **SQLAlchemy & Alembic:** Robust ORM and database migrations.

* **Database:**
    * **PostgreSQL:** Powerful, reliable open-source relational database.

* **Containerization:**
    * **Docker:** Used to containerize the backend and the local PostgreSQL database.

* **API Design:**
    * **RESTful (`/api/v1`):** Follows REST principles with versioned endpoints for clear, scalable communication.


## Local Setup Instructions

Follow these steps to get FeedbackFlow running on your local machine using Docker for the database and Python's virtual environment for the backend.

### Prerequisites

* **Git**
* **Node.js & npm** (v18+ recommended)
* **Python & pip** (3.9+ recommended)
* **Docker Desktop**

### 1. Get the Code

```bash
git clone [https://github.com/crazy-leaf/feedbackhub.git](https://github.com/crazy-leaf/feedbackhub.git)
cd feedbackhub 
```

### 2. Database Setup (Local Docker)
```
docker run --name feedbackflow-postgres -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=feedbackflow_db -p 5432:5432 -d postgres:14-alpine
```

### 3. Backend Setup & Run
```
cd backend

# Create & activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate # For Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with essential variables
# IMPORTANT: Replace 'your_secure_secret_key_here' with a unique, randomly generated key!
# You can generate one with `python -c 'import secrets; print(secrets.token_urlsafe(32))'`
echo "DATABASE_URL=postgresql://user:password@localhost:5432/feedbackflow_db" > .env
echo "SECRET_KEY=your_secure_secret_key_here" >> .env
echo "FRONTEND_URL=http://localhost:5173" >> .env # Matches Vite's default dev server
echo "DEBUG=True" >> .env # Optional

# Apply database migrations
alembic upgrade head

# Run the FastAPI backend
# The backend will be available at http://localhost:8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 
```

### 4. Frontend Setup & Run
```
cd ../frontend # Go back to root, then into frontend

# Install dependencies
npm install

# Create .env file for frontend environment variables
# This tells your frontend where to find the backend
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env

# Start the React development server
# The frontend will typically be available at http://localhost:5173
npm run dev
```

### 5. Building & Running Backend with Docker
```
# Build the Docker image for the backend
docker build -t feedbackflow-backend -f backend/Dockerfile .

# Run the backend Docker container, connecting to your local PostgreSQL
# Ensure 'feedbackflow-postgres' container is running (see step 2 above)
docker run --name feedbackflow-backend-app \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:password@host.docker.internal:5432/feedbackflow_db" \
  -e SECRET_KEY="your_secure_secret_key_here" \
  -e FRONTEND_URL="http://localhost:5173" \
  feedbackflow-backend
```