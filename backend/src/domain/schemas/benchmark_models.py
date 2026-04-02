from pydantic import BaseModel

class BenchmarkRequest(BaseModel):
    test_dir: str | None = "tests/instances"
    files: list[str] | None = None
    time_limit: int | None = 60
    solvers: list[str] = ["cp", "adhoc"]
    heuristics: list[str] = ["ffd", "layer_based", "free_space"]

class BenchmarkResult(BaseModel):
    job_id: str
    status: str
    submit_time: str
    completion_time: str | None = None
    report_file: str | None = None
    summary: dict[str, object] | None = None