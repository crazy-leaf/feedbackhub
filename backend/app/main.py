from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import logging

from app.database import engine, Base, get_db
from app.routers import auth, users, feedback, dashboard
from app.config import settings
from app import crud, schemas, models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def populate_initial_data(db: Session):
    logger.info("Attempting to populate initial data...")
    from app.mockdata import mock_users, mock_feedback

    if db.query(models.User).count() > 0:
        logger.info("Database already contains users. Skipping initial data population.")
        return

    user_id_map = {}
    manager_id_from_mock = None

    for mock_user in mock_users:
        user_in = schemas.UserCreate(
            email=mock_user['email'],
            password=mock_user['password'],
            first_name=mock_user['name'].split(' ')[0],
            last_name=mock_user['name'].split(' ')[1] if len(mock_user['name'].split(' ')) > 1 else "",
            role=mock_user['role']
        )
        try:
            db_user = crud.create_user(db, user_in)
            user_id_map[mock_user['id']] = db_user.id
            if mock_user['role'] == 'manager':
                manager_id_from_mock = db_user.id
            logger.info(f"Created user: {db_user.email} with ID: {db_user.id}")
        except Exception as e:
            logger.error(f"Error creating user {mock_user['email']}: {e}")
            db.rollback()

    if manager_id_from_mock:
        for mock_user in mock_users:
            if mock_user['role'] == 'employee' and mock_user.get('managerId') == 1:
                employee_uuid = user_id_map.get(mock_user['id'])
                if employee_uuid:
                    try:
                        crud.create_team_membership(db, manager_id=manager_id_from_mock, employee_id=employee_uuid)
                        logger.info(f"Assigned employee {mock_user['name']} to manager Sarah Johnson.")
                    except Exception as e:
                        logger.error(f"Error assigning team member {mock_user['name']}: {e}")
                        db.rollback()

    for mock_fb in mock_feedback:
        employee_uuid = user_id_map.get(mock_fb['employeeId'])
        manager_uuid = user_id_map.get(mock_fb['managerId'])

        if employee_uuid and manager_uuid:
            feedback_in = schemas.FeedbackCreate(
                employee_id=employee_uuid,
                strengths=mock_fb['strengths'],
                areas_to_improve=mock_fb['improvements'],
                sentiment=mock_fb['sentiment']
            )
            try:
                db_feedback = crud.create_feedback(db, feedback_in, manager_uuid)
                if mock_fb['acknowledged']:
                     crud.acknowledge_feedback(db, db_feedback)
                logger.info(f"Created feedback {db_feedback.id} for {mock_fb['employeeName']}")
            except Exception as e:
                logger.error(f"Error creating feedback for {mock_fb['employeeName']}: {e}")
                db.rollback()
        else:
            logger.warning(f"Skipping feedback for {mock_fb['employeeName']} due to missing user UUIDs.")

    db.commit()
    logger.info("Initial data population complete.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("FastAPI app starting up...")
    db = next(get_db())
    await populate_initial_data(db)
    db.close()
    yield
    logger.info("FastAPI app shutting down...")

app = FastAPI(lifespan=lifespan)

origins = [
    settings.FRONTEND_URL,
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(feedback.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "FeedbackFlow Backend is running!"}