from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
import uuid

from app import schemas, crud, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(
    user_id: uuid.UUID = Query(..., description="ID of the user for whom to fetch stats"),
    role: str = Query(..., description="Role of the user (manager or employee)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if str(user_id) != str(current_user.id):
        if current_user.role == 'manager' and crud.is_employee_of_manager(db, current_user.id, user_id):
            pass
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view these stats.")

    if role == 'manager':
        if str(user_id) != str(current_user.id) and current_user.role != 'manager':
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers can view manager stats.")
        return crud.get_dashboard_stats_for_manager(db, manager_id=user_id)
    elif role == 'employee':
        return crud.get_dashboard_stats_for_employee(db, employee_id=user_id)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specified.")

@router.get("/recent", response_model=List[schemas.RecentFeedbackEntry])
async def get_recent_feedback_entries(
    user_id: uuid.UUID = Query(..., description="ID of the user for whom to fetch recent feedback"),
    role: str = Query(..., description="Role of the user (manager or employee)"),
    limit: int = Query(5, ge=1, le=20, description="Number of recent feedbacks to fetch"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if str(user_id) != str(current_user.id):
        if current_user.role == 'manager' and crud.is_employee_of_manager(db, current_user.id, user_id):
            pass
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this user's recent feedback.")

    return crud.get_recent_feedback_for_user(db, user_id, role, limit)