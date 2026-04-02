from fastapi import APIRouter, HTTPException, BackgroundTasks
import uuid
from datetime import datetime

from src.domain.schemas import SimulationRequest, SimulationResult
from src.services import BinPacking3DSimulation

router = APIRouter(
    prefix="/simulations",
    tags=["simulations"]
)

simulation_service = BinPacking3DSimulation()

@router.post("/run", response_model=SimulationResult)
async def run_simulation(request: SimulationRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    
    # Create initial job state
    job = {
        'job_id': job_id,
        'status': 'pending',
        'submit_time': datetime.now().isoformat(),
        'request': request.dict()
    }
    
    # Save initial state using the service's internal helper
    simulation_service._save_job(job)
    
    background_tasks.add_task(simulation_service.run, job_id, request)
    
    return SimulationResult(**job)

@router.get("/{job_id}", response_model=SimulationResult)
def get_result(job_id: str):
    result = simulation_service.get_result(job_id)
    if result:
        return result
    raise HTTPException(status_code=404, detail="Job not found")

@router.get("/", response_model=list[SimulationResult])
def list_results():
    return simulation_service.list_results()
