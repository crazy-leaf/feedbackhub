from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
import uuid

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: uuid.UUID
    role: str
    email: Optional[EmailStr] = None # For convenience

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str # 'manager' or 'employee'

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: uuid.UUID
    hashed_password: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Was orm_mode = True in Pydantic v1

class UserPublic(UserBase):
    id: uuid.UUID
    class Config:
        from_attributes = True

# --- Team Schemas ---
class TeamMembershipCreate(BaseModel):
    manager_id: uuid.UUID
    employee_id: uuid.UUID

class TeamMembershipInDB(TeamMembershipCreate):
    id: uuid.UUID
    created_at: datetime
    class Config:
        from_attributes = True

# --- Feedback Schemas ---
class FeedbackBase(BaseModel):
    strengths: str
    areas_to_improve: str
    sentiment: str # 'positive', 'neutral', 'negative'

class FeedbackCreate(FeedbackBase):
    employee_id: uuid.UUID

class FeedbackUpdate(BaseModel):
    strengths: Optional[str] = None
    areas_to_improve: Optional[str] = None
    sentiment: Optional[str] = None
    # acknowledged field is handled by a separate endpoint/schema

class FeedbackInDB(FeedbackBase):
    id: uuid.UUID
    manager_id: uuid.UUID
    employee_id: uuid.UUID
    acknowledged: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FeedbackPublic(FeedbackBase):
    id: uuid.UUID
    manager_id: uuid.UUID
    employee_id: uuid.UUID
    acknowledged: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    manager_name: Optional[str] = None # For display
    employee_name: Optional[str] = None # For display

    class Config:
        from_attributes = True

# --- Dashboard Schemas ---
class DashboardStats(BaseModel):
    total_feedback_given: Optional[int] = None
    total_feedback_received: Optional[int] = None
    positive_feedback_count: Optional[int] = None
    neutral_feedback_count: Optional[int] = None
    negative_feedback_count: Optional[int] = None
    # Add sentiment trends or other aggregated data

class RecentFeedbackEntry(BaseModel):
    id: uuid.UUID
    strengths: str
    areas_to_improve: str
    sentiment: str
    created_at: datetime
    manager_name: Optional[str] = None
    employee_name: Optional[str] = None
    acknowledged: bool

    class Config:
        from_attributes = True