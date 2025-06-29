from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import timedelta

from app import schemas, crud, models
from app.database import get_db
from app.dependencies import create_access_token, get_current_user
from app.config import settings

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/login", response_model=schemas.UserPublic)
async def login_for_access_token(response: Response, user_login: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user_login.email)
    if not db_user or not crud.verify_password(user_login.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user.id), "role": db_user.role, "email": db_user.email},
        expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="Lax",
        expires=access_token_expires.total_seconds(),
        path="/"
    )

    return schemas.UserPublic.model_validate(db_user)

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,
        samesite="Lax",
        path="/"
    )
    return {"message": "Logged out successfully"}

@router.get("/verify", response_model=schemas.UserPublic)
async def verify_token(current_user: models.User = Depends(get_current_user)):
    return schemas.UserPublic.model_validate(current_user)

@router.get("/me", response_model=schemas.UserPublic)
async def read_current_user(current_user: models.User = Depends(get_current_user)):
    return schemas.UserPublic.model_validate(current_user)