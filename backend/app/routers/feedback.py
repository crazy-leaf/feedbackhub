
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app import schemas, crud, models
from app.database import get_db
from app.dependencies import get_current_manager, get_current_employee, get_current_user

router = APIRouter(
    prefix="/feedback",
    tags=["Feedback"]
)

@router.post("/", response_model=schemas.FeedbackPublic)
async def create_feedback_entry(
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_manager: models.User = Depends(get_current_manager)
):
    if not crud.is_employee_of_manager(db, current_manager.id, feedback.employee_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit feedback for your own team members."
        )

    db_feedback = crud.create_feedback(db=db, feedback=feedback, manager_id=current_manager.id)

    manager_user = crud.get_user_by_id(db, db_feedback.manager_id)
    employee_user = crud.get_user_by_id(db, db_feedback.employee_id)

    response_feedback = schemas.FeedbackPublic.model_validate(db_feedback)
    response_feedback.manager_name = f"{manager_user.first_name} {manager_user.last_name}" if manager_user else None
    response_feedback.employee_name = f"{employee_user.first_name} {employee_user.last_name}" if employee_user else None

    return response_feedback

@router.get("/{feedback_id}", response_model=schemas.FeedbackPublic)
async def get_feedback_entry(
    feedback_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_feedback = crud.get_feedback_by_id(db, feedback_id)
    if not db_feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    if not (
        (current_user.role == 'manager' and str(db_feedback.manager_id) == str(current_user.id)) or
        (current_user.role == 'employee' and str(db_feedback.employee_id) == str(current_user.id))
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this feedback.")

    manager_user = crud.get_user_by_id(db, db_feedback.manager_id)
    employee_user = crud.get_user_by_id(db, db_feedback.employee_id)

    response_feedback = schemas.FeedbackPublic.model_validate(db_feedback)
    response_feedback.manager_name = f"{manager_user.first_name} {manager_user.last_name}" if manager_user else None
    response_feedback.employee_name = f"{employee_user.first_name} {employee_user.last_name}" if employee_user else None

    return response_feedback

@router.get("/", response_model=List[schemas.FeedbackPublic])
async def get_feedback_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    employee_id: Optional[uuid.UUID] = Query(None, description="Optional: Filter by employee who received the feedback (recipient)."),
    manager_id: Optional[uuid.UUID] = Query(None, description="Optional: Filter by manager who gave the feedback (giver)."),
):
    feedbacks = []

    if current_user.role == 'manager':
        if employee_id:
            if not crud.is_employee_of_manager(db, current_user.id, employee_id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this employee's feedback history.")
            
            feedbacks = crud.get_feedback_received_by_employee(db, employee_id=employee_id, manager_id=current_user.id)
            
        elif manager_id:
            if str(manager_id) != str(current_user.id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Managers can only retrieve their own given feedback or specific reports' feedback.")
            feedbacks = crud.get_feedback_given_by_manager(db, manager_id=current_user.id)
        else:
            feedbacks = crud.get_feedback_given_by_manager(db, manager_id=current_user.id)


    elif current_user.role == 'employee':
        if employee_id and str(employee_id) != str(current_user.id):
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own feedback history.")
        
        feedbacks = crud.get_feedback_received_by_employee(db, employee_id=current_user.id, manager_id=manager_id)

    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    feedback_public_list = []
    for fb in feedbacks:
        manager_user = crud.get_user_by_id(db, fb.manager_id)
        employee_user = crud.get_user_by_id(db, fb.employee_id)

        response_feedback = schemas.FeedbackPublic.model_validate(fb)
        response_feedback.manager_name = f"{manager_user.first_name} {manager_user.last_name}" if manager_user else None
        response_feedback.employee_name = f"{employee_user.first_name} {employee_user.last_name}" if employee_user else None
        feedback_public_list.append(response_feedback)

    return feedback_public_list

@router.put("/{feedback_id}", response_model=schemas.FeedbackPublic)
async def update_feedback_entry(
    feedback_id: uuid.UUID,
    updates: schemas.FeedbackUpdate,
    db: Session = Depends(get_db),
    current_manager: models.User = Depends(get_current_manager)
):
    db_feedback = crud.get_feedback_by_id(db, feedback_id)
    if not db_feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    if str(db_feedback.manager_id) != str(current_manager.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update feedback you have submitted.")

    updated_feedback = crud.update_feedback(db=db, db_feedback=db_feedback, updates=updates)

    manager_user = crud.get_user_by_id(db, updated_feedback.manager_id)
    employee_user = crud.get_user_by_id(db, updated_feedback.employee_id)

    response_feedback = schemas.FeedbackPublic.model_validate(updated_feedback)
    response_feedback.manager_name = f"{manager_user.first_name} {manager_user.last_name}" if manager_user else None
    response_feedback.employee_name = f"{employee_user.first_name} {employee_user.last_name}" if employee_user else None

    return response_feedback

@router.patch("/{feedback_id}/acknowledge", response_model=schemas.FeedbackPublic)
async def acknowledge_feedback_entry(
    feedback_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_employee: models.User = Depends(get_current_employee)
):
    db_feedback = crud.get_feedback_by_id(db, feedback_id)
    if not db_feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    if str(db_feedback.employee_id) != str(current_employee.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only acknowledge feedback directed to you.")
    if db_feedback.acknowledged:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Feedback already acknowledged.")

    updated_feedback = crud.acknowledge_feedback(db=db, db_feedback=db_feedback)

    manager_user = crud.get_user_by_id(db, updated_feedback.manager_id)
    employee_user = crud.get_user_by_id(db, updated_feedback.employee_id)

    response_feedback = schemas.FeedbackPublic.model_validate(updated_feedback)
    response_feedback.manager_name = f"{manager_user.first_name} {manager_user.last_name}" if manager_user else None
    response_feedback.employee_name = f"{employee_user.first_name} {employee_user.last_name}" if employee_user else None

    return response_feedback

@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feedback_entry(
    feedback_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_manager: models.User = Depends(get_current_manager)
):
    db_feedback = crud.get_feedback_by_id(db, feedback_id)
    if not db_feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    if str(db_feedback.manager_id) != str(current_manager.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete feedback you have submitted.")

    if not crud.delete_feedback(db, feedback_id):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete feedback.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)