from pydantic import BaseModel

class SimulationRequest(BaseModel):
    filename: str
    solver: str  # 'cp' or 'adhoc'
    heuristic: str | None = 'ffd'
    time_limit: int | None = 60

class SimulationResult(BaseModel):
    job_id: str
    status: str
    submit_time: str
    completion_time: str | None = None
    result: dict[str, object] | None = None
    request: dict[str, object] | None = None