from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.uploaded_file import UploadedFile
from app.models.file_metadata import FileMetadata

class FileRepository:
    @staticmethod
    def get_by_uuid(db: Session, file_uuid: str) -> Optional[UploadedFile]:
        """Loads UploadedFile by its UUID."""
        return db.query(UploadedFile).filter(UploadedFile.uuid == file_uuid).first()

    @staticmethod
    def get_by_uuid_and_user(db: Session, file_uuid: str, user_id: int) -> Optional[UploadedFile]:
        """Loads UploadedFile by UUID verifying it belongs to the user."""
        return db.query(UploadedFile).filter(
            UploadedFile.uuid == file_uuid,
            UploadedFile.user_id == user_id
        ).first()

    @staticmethod
    def list_by_user_id(db: Session, user_id: int) -> List[UploadedFile]:
        """Lists all files uploaded by a user."""
        return db.query(UploadedFile).filter(UploadedFile.user_id == user_id).all()

    @staticmethod
    def create_file(db: Session, file_obj: UploadedFile) -> UploadedFile:
        """Saves a new UploadedFile record."""
        db.add(file_obj)
        db.commit()
        db.refresh(file_obj)
        return file_obj

    @staticmethod
    def create_metadata(db: Session, meta_obj: FileMetadata) -> FileMetadata:
        """Saves a new FileMetadata record."""
        db.add(meta_obj)
        db.commit()
        db.refresh(meta_obj)
        return meta_obj

    @staticmethod
    def delete_file(db: Session, file_obj: UploadedFile) -> None:
        """Removes the file record from database."""
        db.delete(file_obj)
        db.commit()
