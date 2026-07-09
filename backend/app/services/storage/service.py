import logging
from typing import Dict, Any, Optional
from app.core.config import settings
from app.services.storage.provider import StorageProvider, LocalStorageProvider, S3StorageProvider

logger = logging.getLogger("app.services.storage.service")

class StorageService:
    _local_provider: Optional[LocalStorageProvider] = None
    _s3_provider: Optional[S3StorageProvider] = None

    @classmethod
    def get_provider(cls, provider_name: Optional[str] = None) -> StorageProvider:
        """Returns the requested provider or the active provider if none is specified."""
        target = (provider_name or settings.active_storage_provider).lower()
        
        if target == "s3":
            if not cls._s3_provider:
                cls._s3_provider = S3StorageProvider()
            return cls._s3_provider
        else:
            if not cls._local_provider:
                cls._local_provider = LocalStorageProvider()
            return cls._local_provider

    @classmethod
    def upload_file(cls, user_uuid: str, file_uuid: str, file_data: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        """Uploads a file using the active storage provider."""
        provider = cls.get_provider()
        logger.info(f"Uploading file {filename} using provider: {settings.active_storage_provider}")
        return provider.upload_file(user_uuid, file_uuid, file_data, filename, content_type)

    @classmethod
    def delete_file(cls, provider_name: str, s3_object_key: Optional[str], bucket_name: Optional[str] = None, file_path: Optional[str] = None) -> bool:
        """Deletes a file using the provider specified in the file's metadata."""
        provider = cls.get_provider(provider_name)
        logger.info(f"Deleting file via provider: {provider_name}")
        return provider.delete_file(s3_object_key, bucket_name, file_path)

    @classmethod
    def download_url(cls, provider_name: str, s3_object_key: Optional[str], bucket_name: Optional[str] = None, file_path: Optional[str] = None, original_filename: Optional[str] = None) -> str:
        """Generates a secure download/pre-signed URL using the file's provider."""
        provider = cls.get_provider(provider_name)
        logger.info(f"Generating download URL via provider: {provider_name}")
        return provider.download_url(s3_object_key, bucket_name, file_path, original_filename)

    @classmethod
    def file_exists(cls, provider_name: str, s3_object_key: Optional[str], bucket_name: Optional[str] = None, file_path: Optional[str] = None) -> bool:
        """Checks if a file exists using the file's provider."""
        provider = cls.get_provider(provider_name)
        return provider.file_exists(s3_object_key, bucket_name, file_path)

    @classmethod
    def download_file_to_path(cls, provider_name: str, s3_object_key: Optional[str], bucket_name: Optional[str], file_path: Optional[str], dest_path: str) -> None:
        """Downloads a file to a local path using the specified provider."""
        provider = cls.get_provider(provider_name)
        provider.download_file_to_path(s3_object_key, bucket_name, file_path, dest_path)
