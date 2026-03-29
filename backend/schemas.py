from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class RoleEnum(str, Enum):
    user = "user"
    admin = "admin"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "pending"

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True
        orm_mode = True

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: RoleEnum = RoleEnum.user
    tasks: List[Task] = []

    class Config:
        from_attributes = True
        orm_mode = True

class UserBasicInfo(BaseModel):
    id: int
    name: str
    email: str
    role: RoleEnum

    class Config:
        from_attributes = True
        orm_mode = True

class TaskWithOwner(Task):
    owner: UserBasicInfo

    class Config:
        from_attributes = True
        orm_mode = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
