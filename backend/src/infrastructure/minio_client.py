import os
from minio import Minio
from minio.error import S3Error

class MinioClient:
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.bucket_name = os.getenv("MINIO_BUCKET", "rpc-instances")
        self.secure = os.getenv("MINIO_SECURE", "False").lower() == "true"
        
        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure
        )
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
        except S3Error as e:
            print(f"MinIO Error: {e}")

    def upload_file(self, file_path: str, object_name: str):
        try:
            self.client.fput_object(self.bucket_name, object_name, file_path)
        except S3Error as e:
            print(f"MinIO Upload Error: {e}")
            raise

    def upload_fileobj(self, file_obj, object_name: str, length: int):
        try:
            self.client.put_object(self.bucket_name, object_name, file_obj, length)
        except S3Error as e:
            print(f"MinIO Upload Error: {e}")
            raise

    def download_file(self, object_name: str, file_path: str):
        try:
            self.client.fget_object(self.bucket_name, object_name, file_path)
        except S3Error as e:
            print(f"MinIO Download Error: {e}")
            raise

    def list_files(self):
        try:
            objects = self.client.list_objects(self.bucket_name, recursive=True)
            return [obj.object_name for obj in objects]
        except S3Error as e:
            print(f"MinIO List Error: {e}")
            return []

    def get_file_content(self, object_name: str) -> str:
        try:
            response = self.client.get_object(self.bucket_name, object_name)
            return response.read().decode('utf-8')
        except S3Error as e:
            print(f"MinIO Get Error: {e}")
            raise
        finally:
            if 'response' in locals():
                response.close()
                
    def get_file_object(self, object_name: str):
        try:
            return self.client.get_object(self.bucket_name, object_name)
        except S3Error as e:
            print(f"MinIO Get Error: {e}")
            raise

    def delete_file(self, object_name: str):
        try:
            self.client.remove_object(self.bucket_name, object_name)
        except S3Error as e:
            print(f"MinIO Delete Error: {e}")
            raise
