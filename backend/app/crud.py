
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, and_
from app import models, schemas
from passlib.context import CryptContext
from typing import List, Dict, Any, Optional
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id: uuid.UUID) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_team_membership(db: Session, manager_id: uuid.UUID, employee_id: uuid.UUID) -> models.TeamMembership:
    db_membership = models.TeamMembership(manager_id=manager_id, employee_id=employee_id)
    db.add(db_membership)
    db.commit()
    db.refresh(db_membership)
    return db_membership

def get_team_members_by_manager_id(db: Session, manager_id: uuid.UUID) -> List[models.User]:
    return db.query(models.User)\
        .join(models.TeamMembership, models.User.id == models.TeamMembership.employee_id)\
        .filter(models.TeamMembership.manager_id == manager_id)\
        .all()

def is_employee_of_manager(db: Session, manager_id: uuid.UUID, employee_id: uuid.UUID) -> bool:
    return db.query(models.TeamMembership).filter(
        and_(models.TeamMembership.manager_id == manager_id,
             models.TeamMembership.employee_id == employee_id)
    ).first() is not None

def create_feedback(db: Session, feedback: schemas.FeedbackCreate, manager_id: uuid.UUID) -> models.Feedback:
    db_feedback = models.Feedback(**feedback.model_dump(), manager_id=manager_id)
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def get_feedback_by_id(db: Session, feedback_id: uuid.UUID) -> Optional[models.Feedback]:
    return db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()

def get_feedback_received_by_employee(db: Session, employee_id: uuid.UUID, manager_id: Optional[uuid.UUID] = None) -> List[models.Feedback]:
    """
    Fetches feedback entries received by a specific employee.
    Optionally filters by the manager who gave the feedback.
    """
    query = db.query(models.Feedback).filter(models.Feedback.employee_id == employee_id)

    if manager_id:
        query = query.filter(models.Feedback.manager_id == manager_id)

    query = query.order_by(models.Feedback.created_at.desc())


    return query.all()

def get_feedback_given_by_manager(db: Session, manager_id: uuid.UUID) -> List[models.Feedback]:
    return db.query(models.Feedback)\
        .filter(models.Feedback.manager_id == manager_id)\
        .order_by(models.Feedback.created_at.desc())\
        .all()

def update_feedback(db: Session, db_feedback: models.Feedback, updates: schemas.FeedbackUpdate) -> models.Feedback:
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_feedback, key, value)
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def acknowledge_feedback(db: Session, db_feedback: models.Feedback) -> models.Feedback:
    db_feedback.acknowledged = True
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def delete_feedback(db: Session, feedback_id: uuid.UUID):
    db_feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if db_feedback:
        db.delete(db_feedback)
        db.commit()
        return True
    return False

def get_dashboard_stats_for_manager(db: Session, manager_id: uuid.UUID) -> Dict[str, Any]:
    total_feedback_given = db.query(func.count(models.Feedback.id)).filter(models.Feedback.manager_id == manager_id).scalar()

    sentiment_counts = db.query(
        models.Feedback.sentiment,
        func.count(models.Feedback.id)
    ).filter(models.Feedback.manager_id == manager_id)\
    .group_by(models.Feedback.sentiment).all()

    sentiment_dict = {s: c for s, c in sentiment_counts}

    return {
        "total_feedback_given": total_feedback_given,
        "positive_feedback_count": sentiment_dict.get("positive", 0),
        "neutral_feedback_count": sentiment_dict.get("neutral", 0),
        "negative_feedback_count": sentiment_dict.get("negative", 0),
    }

def get_dashboard_stats_for_employee(db: Session, employee_id: uuid.UUID) -> Dict[str, Any]:
    total_feedback_received = db.query(func.count(models.Feedback.id)).filter(models.Feedback.employee_id == employee_id).scalar()

    sentiment_counts = db.query(
        models.Feedback.sentiment,
        func.count(models.Feedback.id)
    ).filter(models.Feedback.employee_id == employee_id)\
    .group_by(models.Feedback.sentiment).all()

    sentiment_dict = {s: c for s, c in sentiment_counts}

    return {
        "total_feedback_received": total_feedback_received,
        "positive_feedback_count": sentiment_dict.get("positive", 0),
        "neutral_feedback_count": sentiment_dict.get("neutral", 0),
        "negative_feedback_count": sentiment_dict.get("negative", 0),
    }

def get_recent_feedback_for_user(db: Session, user_id: uuid.UUID, role: str, limit: int = 5) -> List[schemas.RecentFeedbackEntry]:
    query = db.query(models.Feedback)\
        .options(joinedload(models.Feedback.manager))\
        .options(joinedload(models.Feedback.employee))

    if role == 'employee':
        query = query.filter(models.Feedback.employee_id == user_id)
    elif role == 'manager':
        query = query.filter(models.Feedback.manager_id == user_id)
    else:
        return []

    feedbacks = query.order_by(models.Feedback.created_at.desc()).limit(limit).all()

    recent_entries = []
    for fb in feedbacks:
        entry = schemas.RecentFeedbackEntry(
            id=fb.id,
            strengths=fb.strengths,
            areas_to_improve=fb.areas_to_improve,
            sentiment=fb.sentiment,
            created_at=fb.created_at,
            acknowledged=fb.acknowledged,
            manager_name=f"{fb.manager.first_name} {fb.manager.last_name}" if fb.manager else None,
            employee_name=f"{fb.employee.first_name} {fb.employee.last_name}" if fb.employee else None
        )
        recent_entries.append(entry)
    return recent_entries