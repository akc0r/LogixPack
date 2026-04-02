import asyncio
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks
import uuid

from src.domain.schemas import BenchmarkRequest, BenchmarkResult
from src.services import BinPacking3DBenchmark

router = APIRouter(
    prefix="/benchmarks",
    tags=["benchmarks"]
)

benchmark_service = BinPacking3DBenchmark()

@router.post("/run", response_model=BenchmarkResult)
async def run_benchmark(request: BenchmarkRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    
    job = {
        'job_id': job_id,
        'status': 'pending',
        'submit_time': datetime.now().isoformat(),
        'request': request.dict()
    }

    await asyncio.to_thread(benchmark_service._save_job, job)
    
    background_tasks.add_task(benchmark_service.run, job_id, request)
    
    return BenchmarkResult(**job)

@router.get("/{job_id}", response_model=BenchmarkResult)
def get_result(job_id: str):
    result = benchmark_service.get_result(job_id)
    if result:
        return result
    raise HTTPException(status_code=404, detail="Job not found")

@router.get("/", response_model=list[BenchmarkResult])
def list_results():
    return benchmark_service.list_results()
