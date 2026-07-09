import abc
import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger("app.services.storage.provider")

class StorageProvider(abc.ABC):
    @abc.abstractmethod
    def upload_file(self, user_uuid: str, file_uuid: str, file_data: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        """Uploads a file to the storage backend and returns a metadata dictionary."""
        pass

    @abc.abstractmethod
    def delete_file(self, s3_object_key: Optional[str], bucket_name: Optional[str] = None, file_path: Optional[str] = None) -> bool:
        """Deletes a file from the storage backend."""
        pass

    @abc.abstractmethod
    def download_url(self, s3_object_key: Optional[str], bucket_name: Optional[str] = None, file_path: Optional[str] = None, original_filename: Optional[str] = None) -> str:
        """Generates a temporary pre-signed URL or download link."""
        pass

    @abc.abstractmethod
    def file_exists(self, s3_object_key: Optional[str], bucket_name: Optional[str] = None, file_path: Optional[str] = None) -> bool:
        """Checks if a file exists in the storage backend."""
        pass


class LocalStorageProvider(StorageProvider):
    def __init__(self, upload_dir: Optional[Path] = None):
        self.upload_dir = upload_dir or settings.upload_path
        os.makedirs(self.upload_dir, exist_ok=True)

    def upload_file(self, user_uuid: str, file_uuid: str, file_data: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        stored_filename = f"{file_uuid}.pdf"
        target_path = self.upload_dir / stored_filename
        
        with open(target_path, "wb") as f:
            f.write(file_data)
            
        logger.info(f"File {filename} uploaded locally to {target_path}")
        
        return {
            "storage_provider": "local",
            "s3_object_key": None,
            "bucket_name": None,
            "storage_url": str(target_path),
            "etag": None,
            "upload_completed": True,
            "storage_size": len(file_data),
            "file_path": str(target_path),
            "stored_filename": stored_filename
        }

    def delete_file(self, s3_object_key: Optional[str], bucket_name: Optional[str] = None, file_path: Optional[str] = None) -> bool:
        if not file_path:
            return False
        path = Path(file_path)
        if path.exists():
            try:
                os.remove(path)
                logger.info(f"Local file {file_path} deleted successfully")
                return True
            except Exception as e:
                logger.error(f"Failed to delete local file {file_path}: {e}")
                return False
        return False

    def download_url(self, s3_object_key: Optional[str], bucket_name: Optional[str] = None, file_path: Optional[str] = None, original_filename: Optional[str] = None) -> str:
        # For local files, return relative API endpoint to serve binary payload directly
        # E.g. /api/v1/files/download/{id}?direct=true
        return f"/api/v1/files/download/{s3_object_key or 'local'}?direct=true"

    def file_exists(self, s3_object_key: Optional[str], bucket_name: Optional[str] = None, file_path: Optional[str] = None) -> bool:
        if not file_path:
            return False
        return Path(file_path).exists()


class S3StorageProvider(StorageProvider):
    def __init__(self):
        self.bucket_name = settings.AWS_S3_BUCKET
        self.region_name = settings.AWS_REGION
        
        client_kwargs = {
            "region_name": self.region_name
        }
        if settings.AWS_ACCESS_KEY_ID:
            client_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        if settings.AWS_SECRET_ACCESS_KEY:
            client_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        if settings.AWS_ENDPOINT_URL:
            client_kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL

        self.s3_client = boto3.client("s3", **client_kwargs)

    def upload_file(self, user_uuid: str, file_uuid: str, file_data: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        # S3 folder structure: users/{user_uuid}/pdfs/{file_uuid}.pdf
        s3_key = f"users/{user_uuid}/pdfs/{file_uuid}.pdf"
        
        try:
            logger.info(f"Starting S3 upload. Bucket: {self.bucket_name}, Key: {s3_key}")
            response = self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_data,
                ContentType=content_type
            )
            
            etag = response.get("ETag", "").strip('"')
            storage_url = f"https://{self.bucket_name}.s3.{self.region_name}.amazonaws.com/{s3_key}"
            if settings.AWS_ENDPOINT_URL:
                # LocalStack / custom mock URL format
                storage_url = f"{settings.AWS_ENDPOINT_URL}/{self.bucket_name}/{s3_key}"

            logger.info(f"Successfully uploaded {filename} to S3 bucket {self.bucket_name} as {s3_key}")
            
            return {
                "storage_provider": "s3",
                "s3_object_key": s3_key,
                "bucket_name": self.bucket_name,
                "storage_url": storage_url,
                "etag": etag,
                "upload_completed": True,
                "storage_size": len(file_data),
                "file_path": s3_key,
                "stored_filename": f"{file_uuid}.pdf"
            }
        except ClientError as e:
            logger.error(f"S3 upload failed for {filename}: {e}")
            raise HTTPException(status_code=500, detail=f"S3 Storage Upload failed: {str(e)}")

    def delete_file(self, s3_object_key: Optional[str], bucket_name: Optional[str] = None, file_path: Optional[str] = None) -> bool:
        bucket = bucket_name or self.bucket_name
        key = s3_object_key or file_path
        if not key:
            return False
        try:
            self.s3_client.delete_object(Bucket=bucket, Key=key)
            logger.info(f"S3 object {key} deleted successfully from bucket {bucket}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete S3 object {key} from bucket {bucket}: {e}")
            return False

    def download_url(self, s3_object_key: Optional[str], bucket_name: Optional[str] = None, file_path: Optional[str] = None, original_filename: Optional[str] = None) -> str:
        bucket = bucket_name or self.bucket_name
        key = s3_object_key or file_path
        if not key:
            raise ValueError("S3 Object Key or file path is required to generate download URL")
        try:
            params = {
                "Bucket": bucket,
                "Key": key
            }
            if original_filename:
                # Add attachment content disposition response override
                params["ResponseContentDisposition"] = f'inline; filename="{original_filename}"'

            url = self.s3_client.generate_presigned_url(
                ClientMethod="get_object",
                Params=params,
                ExpiresIn=3600
            )
            logger.info(f"Generated secure S3 pre-signed URL for {key}")
            return url
        except ClientError as e:
            logger.error(f"Failed to generate pre-signed S3 URL for {key}: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate secure S3 download link.")

    def file_exists(self, s3_object_key: Optional[str], bucket_name: Optional[str] = None, file_path: Optional[str] = None) -> bool:
        bucket = bucket_name or self.bucket_name
        key = s3_object_key or file_path
        if not key:
            return False
        try:
            self.s3_client.head_object(Bucket=bucket, Key=key)
            return True
        except ClientError:
            return False
