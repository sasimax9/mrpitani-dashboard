import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_image(file_path: str, file_data: bytes, content_type: str) -> dict:
    """Upload image to Supabase Storage"""
    bucket_name = "product-images"
    
    # Create bucket if it doesn't exist (will fail silently if exists)
    try:
        supabase.storage.create_bucket(bucket_name, options={"public": True})
    except:
        pass
    
    # Upload file
    res = supabase.storage.from_(bucket_name).upload(
        file_path,
        file_data,
        file_options={"content-type": content_type, "upsert": "true"}
    )
    
    # Get public URL
    public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
    
    return {"path": file_path, "url": public_url}

def delete_image(file_path: str) -> bool:
    """Delete image from Supabase Storage"""
    bucket_name = "product-images"
    try:
        supabase.storage.from_(bucket_name).remove([file_path])
        return True
    except:
        return False

def list_images(prefix: str = "") -> list:
    """List images in Supabase Storage"""
    bucket_name = "product-images"
    try:
        files = supabase.storage.from_(bucket_name).list(prefix)
        return files
    except:
        return []
