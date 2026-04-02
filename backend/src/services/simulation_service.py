import os
import io
import json
import asyncio
import tempfile
from datetime import datetime

from src.infrastructure import MinioClient
from src.domain.schemas import SimulationRequest, SimulationResult
from src.domain.entities import Item, Vehicle, Solution
from src.utils import read_input
from src.solvers import ConstraintProgrammingSolver, FirstFitDecreasingSolver, FreeSpaceSolver, LayerBasedSolver

class BinPacking3DSimulation:
    def __init__(self):
        self.minio_client = MinioClient()

    def _save_job(self, job: dict):
        content = json.dumps(job, indent=2).encode('utf-8')
        file_obj = io.BytesIO(content)
        object_name = f"results/simulations/{job['job_id']}.json"
        self.minio_client.upload_fileobj(file_obj, object_name, len(content))

    async def _download_input_file(self, filename: str) -> str:
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.txt', delete=False) as tmp_file:
            temp_input_path = tmp_file.name
        
        try:
            # Run blocking MinIO call in a thread
            await asyncio.to_thread(self.minio_client.download_file, filename, temp_input_path)
            return temp_input_path
        except Exception as e:
            if os.path.exists(temp_input_path):
                os.unlink(temp_input_path)
            raise e

    def _solve(self, input_path: str, request: SimulationRequest) -> dict[str, object]:
        try:
            with open(input_path, 'r') as f:
                vehicle_dims, M, items_data = read_input(f)
            
            L, W, H = vehicle_dims
            items_obj = [Item(i, l, w, h, d) for i, (l, w, h, d) in enumerate(items_data)]
            vehicle = Vehicle(0, L, W, H)
            
            solver = None
            start_time = datetime.now()
            
            if request.solver == 'cp':
                solver = ConstraintProgrammingSolver(vehicle, items_obj, None, request.time_limit)
            elif request.solver == 'adhoc':
                if request.heuristic == "free_space":
                    solver = FreeSpaceSolver((L, W, H), items_obj)
                elif request.heuristic == "layer_based":
                    solver = LayerBasedSolver((L, W, H), items_obj)
                elif request.heuristic == "ffd":
                    solver = FirstFitDecreasingSolver(
                        (L, W, H), items_obj, enable_improvements=True, time_limit=request.time_limit
                    )
                else:
                    raise ValueError(f"Unknown heuristic: {request.heuristic}")
            else:
                raise ValueError(f"Unknown solver: {request.solver}")

            solution = solver.solve()
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            result = {
                'duration': duration,
                'return_code': 0
            }
            
            if solution and solution.status == "SAT":
                result['solution_status'] = "SAT"
                result['num_vehicles'] = solution.num_vehicles
                
                placed_items = []
                for item in solution.items:
                    placed_items.append({
                        'id': item.id,
                        'x': item.x0,
                        'y': item.y0,
                        'z': item.z0,
                        'width': item.x1 - item.x0,
                        'height': item.y1 - item.y0,
                        'depth': item.z1 - item.z0,
                        'vehicle_id': item.vehicle_id
                    })
                result['items'] = placed_items
            else:
                result['solution_status'] = "UNSAT" if solution else "FAILED"
                result['items'] = []
                
            return result

        except Exception as e:
            return {
                'return_code': 1,
                'error': str(e),
                'duration': 0,
                'solution_status': 'ERROR'
            }

    async def run(self, job_id: str, request: SimulationRequest):
        # Fetch current job state or create initial running state
        job = {
            'job_id': job_id,
            'status': 'running',
            'submit_time': datetime.now().isoformat(),
            'request': request.dict()
        }
        
        # Try to preserve original submit_time if job exists
        try:
            content = await asyncio.to_thread(self.minio_client.get_file_content, f"results/simulations/{job_id}.json")
            existing_job = json.loads(content)
            job['submit_time'] = existing_job.get('submit_time', job['submit_time'])
        except:
            pass
            
        await asyncio.to_thread(self._save_job, job)
        
        temp_input_path = None
        try:
            temp_input_path = await self._download_input_file(request.filename)
            
            # Run the solver in a separate thread to avoid blocking the event loop
            result_data = await asyncio.to_thread(self._solve, temp_input_path, request)
            
            if result_data['return_code'] == 0:
                job['status'] = 'completed'
            else:
                job['status'] = 'failed'
            
            job['result'] = result_data
                
        except Exception as e:
            job['status'] = 'failed'
            job['result'] = {'error': f'File not found in storage or download failed: {str(e)}'}
        finally:
            if temp_input_path and os.path.exists(temp_input_path):
                os.unlink(temp_input_path)
            
        job['completion_time'] = datetime.now().isoformat()
        await asyncio.to_thread(self._save_job, job)

    def get_result(self, job_id: str) -> SimulationResult | None:
        try:
            content = self.minio_client.get_file_content(f"results/simulations/{job_id}.json")
            data = json.loads(content)
            return SimulationResult(**data)
        except Exception:
            return None

    def list_results(self) -> list[SimulationResult]:
        results = []
        try:
            files = self.minio_client.list_files()
            result_files = [f for f in files if f.startswith("results/simulations/") and f.endswith(".json")]
            
            for f in result_files:
                try:
                    content = self.minio_client.get_file_content(f)
                    data = json.loads(content)
                    if 'request' in data and 'filename' in data['request']:
                        results.append(SimulationResult(**data))
                except Exception:
                    continue
        except Exception as e:
            print(f"Error listing results: {e}")
            
        return sorted(results, key=lambda x: x.submit_time, reverse=True)
