import io

from fastapi import APIRouter, HTTPException, UploadFile, File
from src.domain.schemas import InstanceStats, InstanceDetails, Item
from src.infrastructure import MinioClient

router = APIRouter(
    prefix="/instances",
    tags=["instances"]
)

minio_client = MinioClient()

def parse_instance_content(filename: str, content: str) -> InstanceStats:
    lines = content.splitlines()
    # Skip empty lines
    lines = [l for l in lines if l.strip()]
    if not lines:
        raise ValueError("Empty file")
        
    L, W, H = map(int, lines[0].strip().split())
    M = int(lines[1].strip())
    return InstanceStats(
        filename=filename,
        vehicle_L=L,
        vehicle_W=W,
        vehicle_H=H,
        num_items=M
    )

@router.get("/", response_model=list[InstanceStats])
def list_instances():
    files = minio_client.list_files()
    stats = []
    for f in files:
        # Skip results directory and any directory markers
        if f.startswith("results/") or f.endswith("/"):
            continue
            
        try:
            content = minio_client.get_file_content(f)
            stats.append(parse_instance_content(f, content))
        except Exception as e:
            print(f"Error parsing {f}: {e}")
    return sorted(stats, key=lambda x: x.filename)

@router.post("/upload", response_model=InstanceStats)
async def upload_instance(file: UploadFile = File(...)):
    try:
        content = await file.read()
        content_str = content.decode('utf-8')
        
        stats = parse_instance_content(file.filename, content_str)
        
        # Reset cursor to upload
        await file.seek(0)
        
        file_obj = io.BytesIO(content)
        minio_client.upload_fileobj(file_obj, file.filename, len(content))
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid instance file: {str(e)}")

@router.get("/{filename}", response_model=InstanceDetails)
def get_instance_details(filename: str):
    try:
        content = minio_client.get_file_content(filename)
        lines = content.splitlines()
        lines = [l for l in lines if l.strip()]
        
        if not lines:
            raise ValueError("Empty file")
            
        L, W, H = map(int, lines[0].strip().split())
        M = int(lines[1].strip())
        
        items = []
        for i, line in enumerate(lines[2:], 1):
            parts = list(map(int, line.strip().split()))
            if len(parts) >= 3:
                items.append(Item(
                    id=i,
                    width=parts[0],
                    height=parts[1],
                    depth=parts[2],
                    delivery_order=parts[3] if len(parts) > 3 else -1
                ))
                
        return InstanceDetails(
            filename=filename,
            vehicle_L=L,
            vehicle_W=W,
            vehicle_H=H,
            num_items=M,
            items=items
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Instance not found or invalid: {str(e)}")

@router.delete("/{filename}")
def delete_instance(filename: str):
    try:
        minio_client.delete_file(filename)
        return {"message": f"Instance {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete instance: {str(e)}")
