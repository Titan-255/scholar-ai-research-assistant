from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User

class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        """Queries a user by their integer Primary Key."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_uuid(db: Session, user_uuid: str) -> Optional[User]:
        """Queries a user by their unique UUID string."""
        return db.query(User).filter(User.uuid == user_uuid).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Queries a user by their unique email address."""
        # Convert email to lowercase for case-insensitive query match consistency
        return db.query(User).filter(User.email == email.lower().strip()).first()

    @staticmethod
    def create(db: Session, user: User) -> User:
        """Saves a new user instance to the database."""
        # Force email to lowercase on write
        user.email = user.email.lower().strip()
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update(db: Session, user: User) -> User:
        """Commits changes to an existing user model."""
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete(db: Session, user: User) -> None:
        """Removes a user model from the database session."""
        db.delete(user)
        db.commit()
