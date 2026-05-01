# @AI-HINT: AWS S3 utility functions for file uploads, presigned URLs, and bucket management
"""
AWS S3 utility functions for file uploads and management
"""

from typing import Optional
import boto3
from botocore.exceptions import ClientError
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class S3Client:
    def __init__(self):
        client_kwargs = {
            'service_name': 's3',
            'region_name': settings.aws_region or 'auto', # R2 typically defaults to 'auto'
        }
        
        if settings.aws_access_key_id:
            client_kwargs['aws_access_key_id'] = settings.aws_access_key_id
            client_kwargs['aws_secret_access_key'] = settings.aws_secret_access_key
            
        if getattr(settings, 'aws_endpoint_url', None):
            client_kwargs['endpoint_url'] = settings.aws_endpoint_url
            
        self.s3_client = boto3.client(**client_kwargs)
        
    def upload_file(
        self,
        file_obj,
        bucket_name: str,
        object_name: str,
        content_type: Optional[str] = None
    ) -> Optional[str]:
        """
        Upload a file to S3 bucket
        
        Args:
            file_obj: File object to upload
            bucket_name: Target S3 bucket
            object_name: S3 object name (key)
            content_type: MIME type of the file
            
        Returns:
            S3 URL of uploaded file or None if failed
        """
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            self.s3_client.upload_fileobj(
                file_obj,
                bucket_name,
                object_name,
                ExtraArgs=extra_args
            )
            
            if getattr(settings, 'aws_custom_domain', None):
                domain = settings.aws_custom_domain.rstrip('/')
                url = f"{domain}/{object_name}"
            elif getattr(settings, 'aws_endpoint_url', None):
                endpoint = settings.aws_endpoint_url.rstrip('/')
                url = f"{endpoint}/{bucket_name}/{object_name}"
            else:
                url = f"https://{bucket_name}.s3.{settings.aws_region}.amazonaws.com/{object_name}"
                
            logger.info(f"File uploaded successfully to {url}")
            return url
            
        except ClientError as e:
            logger.error(f"Error uploading file to S3: {e}")
            return None
    
    def generate_presigned_url(
        self,
        bucket_name: str,
        object_name: str,
        expiration: int = 3600
    ) -> Optional[str]:
        """
        Generate a presigned URL for S3 object
        
        Args:
            bucket_name: S3 bucket name
            object_name: S3 object key
            expiration: URL expiration time in seconds
            
        Returns:
            Presigned URL or None if failed
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket_name, 'Key': object_name},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            return None
    
    def delete_file(self, bucket_name: str, object_name: str) -> bool:
        """
        Delete a file from S3 bucket
        
        Args:
            bucket_name: S3 bucket name
            object_name: S3 object key
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.s3_client.delete_object(Bucket=bucket_name, Key=object_name)
            logger.info(f"File deleted successfully: {object_name}")
            return True
        except ClientError as e:
            logger.error(f"Error deleting file from S3: {e}")
            return False
    
    def list_files(self, bucket_name: str, prefix: str = "") -> list:
        """
        List files in S3 bucket with optional prefix
        
        Args:
            bucket_name: S3 bucket name
            prefix: Object key prefix to filter
            
        Returns:
            List of object keys
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=bucket_name,
                Prefix=prefix
            )
            
            if 'Contents' in response:
                return [obj['Key'] for obj in response['Contents']]
            return []
            
        except ClientError as e:
            logger.error(f"Error listing files from S3: {e}")
            return []


# Singleton instance
s3_client = S3Client()


def get_s3_client() -> S3Client:
    """Dependency for FastAPI routes"""
    return s3_client
