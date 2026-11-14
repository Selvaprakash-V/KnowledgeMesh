from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import client_ip, get_current_user
from app.database import get_db
from app.exceptions import AppError
from app.models import Conversation, Message, User
from app.repositories.audit import write_audit
from app.schemas.api import FeedbackOut, FeedbackRequest
from app.models import Feedback

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackOut, status_code=201)
def create_feedback(body: FeedbackRequest, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    message = db.get(Message, body.message_id)
    if message is None or message.role != "ASSISTANT":
        raise AppError("MESSAGE_NOT_FOUND", "Assistant message not found.", 404)
    conversation = db.get(Conversation, message.conversation_id)
    if conversation is None or conversation.user_id != user.id:
        raise AppError("FORBIDDEN", "You cannot leave feedback on this message.", 403)
    feedback = Feedback(message_id=message.id, user_id=user.id, rating=body.rating, comment=body.comment)
    db.add(feedback)
    write_audit(
        db,
        user_id=user.id,
        action="feedback.create",
        resource_type="message",
        resource_id=str(message.id),
        metadata={"rating": body.rating},
        ip_address=client_ip(request),
    )
    db.commit()
    db.refresh(feedback)
    return feedback
