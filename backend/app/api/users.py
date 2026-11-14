import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.database import get_db
from app.exceptions import AppError
from app.models import User
from app.schemas.api import UpdateUserRequest, UserOut
from app.utils.time import utcnow

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return list(db.scalars(select(User).order_by(User.created_at)))


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: uuid.UUID, body: UpdateUserRequest, actor: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise AppError("USER_NOT_FOUND", "User not found.", 404)
    if body.role is not None and user.id == actor.id and body.role != "ADMIN":
        admins = db.scalar(select(func.count()).select_from(User).where(User.role == "ADMIN", User.status == "ACTIVE"))
        if admins <= 1:
            raise AppError("LAST_ADMIN", "The only active administrator cannot remove their own admin role.", 400)
    if body.status == "DISABLED" and user.id == actor.id:
        raise AppError("CANNOT_DISABLE_SELF", "You cannot disable your own account.", 400)
    if body.name is not None:
        user.name = body.name.strip()
    if body.role is not None:
        user.role = body.role
    if body.status is not None:
        user.status = body.status
    user.updated_at = utcnow()
    db.commit()
    db.refresh(user)
    return user
