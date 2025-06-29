from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app import schemas, crud, models
from app.database import get_db
from app.dependencies import get_current_manager, get_current_user, get_current_employee

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/{user_id}", response_model=schemas.UserPublic)
async def get_user(user_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if str(user_id) == str(current_user.id):
        return schemas.UserPublic.model_validate(current_user)

    if current_user.role == 'manager':
        if crud.is_employee_of_manager(db, current_user.id, user_id):
            user = crud.get_user_by_id(db, user_id)
            if user:
                return schemas.UserPublic.model_validate(user)
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager can only view their own team members.")

    if current_user.role == 'employee':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employees cannot view other users.")

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or unauthorized.")

@router.get("/team/{manager_id}", response_model=List[schemas.UserPublic])
async def get_team_members(
    manager_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_manager: models.User = Depends(get_current_manager)
):
    if str(manager_id) != str(current_manager.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own team members.")

    team_members = crud.get_team_members_by_manager_id(db, manager_id=manager_id)
    return [schemas.UserPublic.model_validate(member) for member in team_members]

@router.post("/", response_model=schemas.UserPublic)
async def create_new_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.post("/assign-team-member", response_model=schemas.TeamMembershipInDB)
async def assign_team_member(
    membership: schemas.TeamMembershipCreate,
    db: Session = Depends(get_db),
    current_manager: models.User = Depends(get_current_manager)
):
    if str(membership.manager_id) != str(current_manager.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only assign employees to your own team.")

    if crud.get_user_by_id(db, membership.employee_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")
    if crud.get_user_by_id(db, membership.manager_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager not found.")

    existing_membership = crud.is_employee_of_manager(db, membership.manager_id, membership.employee_id)
    if existing_membership:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee is already assigned to this manager.")

    employee_to_assign = crud.get_user_by_id(db, membership.employee_id)
    if not employee_to_assign or employee_to_assign.role != 'employee':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only assign users with 'employee' role.")


    return crud.create_team_membership(db=db, manager_id=membership.manager_id, employee_id=membership.employee_id)