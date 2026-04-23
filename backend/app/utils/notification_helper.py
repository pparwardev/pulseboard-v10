from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User


def create_notification(db: Session, title: str, message: str, notification_type: str, user_id: int = None):
    notification = Notification(title=title, message=message, type=notification_type, is_read=False, user_id=user_id)
    db.add(notification)
    db.commit()
    return notification
