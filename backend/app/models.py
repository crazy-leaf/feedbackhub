from sqlalchemy import Column, ForeignKey, String, Boolean, DateTime, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    role = Column(String(50), nullable=False) # 'manager' or 'employee'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    managed_employees = relationship("TeamMembership", back_populates="manager", foreign_keys="[TeamMembership.manager_id]")
    team_membership = relationship("TeamMembership", back_populates="employee", uselist=False, foreign_keys="[TeamMembership.employee_id]") # Employee's single manager

    submitted_feedback = relationship("Feedback", back_populates="manager", foreign_keys="[Feedback.manager_id]")
    received_feedback = relationship("Feedback", back_populates="employee", foreign_keys="[Feedback.employee_id]")


class TeamMembership(Base):
    __tablename__ = "team_memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True) # An employee can only have one manager in this system

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    manager = relationship("User", back_populates="managed_employees", foreign_keys=[manager_id])
    employee = relationship("User", back_populates="team_membership", foreign_keys=[employee_id])

    __table_args__ = (UniqueConstraint('manager_id', 'employee_id', name='_manager_employee_uc'),)


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    strengths = Column(String, nullable=False)
    areas_to_improve = Column(String, nullable=False)
    sentiment = Column(String(20), nullable=False) # 'positive', 'neutral', 'negative'
    acknowledged = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    manager = relationship("User", back_populates="submitted_feedback", foreign_keys=[manager_id])
    employee = relationship("User", back_populates="received_feedback", foreign_keys=[employee_id])