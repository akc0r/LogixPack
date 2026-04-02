import os
import json
import asyncio
import tempfile
from datetime import datetime

from src.domain.schemas import BenchmarkRequest, BenchmarkResult
from src.infrastructure import MinioClient
from src.utils import read_input
from src.domain.entities import Item, Vehicle, Solution
from src.solvers import ConstraintProgrammingSolver, FirstFitDecreasingSolver, FreeSpaceSolver, LayerBasedSolver

class BinPacking3DBenchmark:
    def __init__(self):
        self.minio_client = MinioClient()

    def _save_job(self, job: dict):
        import io
        content = json.dumps(job, indent=2).encode('utf-8')
        file_obj = io.BytesIO(content)
        object_name = f"results/benchmarks/{job['job_id']}.json"
        self.minio_client.upload_fileobj(file_obj, object_name, len(content))

    def _solve_instance(self, input_path: str, solver_name: str, heuristic: str | None, time_limit: int) -> dict[str, object]:
        try:
            with open(input_path, 'r') as f:
                vehicle_dims, M, items_data = read_input(f)
            
            L, W, H = vehicle_dims
            items_obj = [Item(i, l, w, h, d) for i, (l, w, h, d) in enumerate(items_data)]
            vehicle = Vehicle(0, L, W, H)
            
            solver = None
            start_time = datetime.now()
            
            if solver_name == 'cp':
                solver = ConstraintProgrammingSolver(vehicle, items_obj, None, time_limit)
            elif solver_name == 'adhoc':
                if heuristic == "free_space":
                    solver = FreeSpaceSolver((L, W, H), items_obj)
                elif heuristic == "layer_based":
                    solver = LayerBasedSolver((L, W, H), items_obj)
                elif heuristic == "ffd":
                    solver = FirstFitDecreasingSolver(
                        (L, W, H), items_obj, enable_improvements=True, time_limit=time_limit
                    )
                else:
                    raise ValueError(f"Unknown heuristic: {heuristic}")
            else:
                raise ValueError(f"Unknown solver: {solver_name}")

            solution = solver.solve()
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            result = {
                'duration': duration,
                'return_code': 0
            }
            
            if solution and solution.status == "SAT":
                result['status'] = "SAT"
                result['num_vehicles'] = solution.num_vehicles
            else:
                result['status'] = "UNSAT" if solution else "FAILED"
                
            return result

        except Exception as e:
            return {
                'return_code': 1,
                'error': str(e),
                'duration': 0,
                'status': 'ERROR'
            }

    async def run(self, job_id: str, request: BenchmarkRequest):
        # Fetch current job state
        job = {
            'job_id': job_id,
            'status': 'running',
            'submit_time': datetime.now().isoformat(),
            'request': request.dict()
        }
        try:
            content = await asyncio.to_thread(self.minio_client.get_file_content, f"results/benchmarks/{job_id}.json")
            existing_job = json.loads(content)
            job['submit_time'] = existing_job.get('submit_time', job['submit_time'])
        except:
            pass
            
        await asyncio.to_thread(self._save_job, job)
        
        test_files = []
        
        try:
            all_files = await asyncio.to_thread(self.minio_client.list_files)
            print(f"DEBUG: All files in MinIO: {all_files}")
            print(f"DEBUG: Request files: {request.files}")
            print(f"DEBUG: Request test_dir: {request.test_dir}")

            if request.files:
                # If specific files are requested, use them directly
                test_files = [f for f in request.files if f in all_files]
                if not test_files:
                    print(f"DEBUG: No requested files found in MinIO. Requested: {request.files}")
            else:
                files = all_files
                # Filter files: exclude results/ and ensure .txt extension
                candidates = [f for f in files if not f.startswith("results/") and f.endswith(".txt")]
                
                # Use test_dir as prefix if provided and not a special keyword
                if request.test_dir and request.test_dir not in ["minio", "remote", "."]:
                    prefix = request.test_dir
                    if not prefix.endswith('/'):
                        prefix += '/'
                    test_files = [f for f in candidates if f.startswith(prefix)]
                    
                    # Fallback: if no files found with prefix, and prefix is tests/instances, try root
                    if not test_files and request.test_dir == "tests/instances":
                         print("DEBUG: Fallback to root files for tests/instances")
                         test_files = candidates
                else:
                    test_files = candidates
                
        except Exception as e:
            print(f"DEBUG: Error listing files: {e}")
            job['status'] = 'failed'
            job['summary'] = {'error': f"Failed to list files from MinIO: {str(e)}"}
            job['completion_time'] = datetime.now().isoformat()
            await asyncio.to_thread(self._save_job, job)
            return
        
        if not test_files:
            job['status'] = 'failed'
            job['summary'] = {'error': f"No test files found in MinIO (prefix: {request.test_dir}). Available: {all_files[:10]}..."}
            job['completion_time'] = datetime.now().isoformat()
            await asyncio.to_thread(self._save_job, job)
            return

        results = {}
        
        for solver in request.solvers:
            results[solver] = {}
            heuristics = request.heuristics if solver == 'adhoc' else [None]
            
            for heuristic in heuristics:
                key = f"{solver}_{heuristic}" if heuristic else solver
                results[solver][key] = []
                
                for file_entry in test_files:
                    filename = os.path.basename(file_entry)
                    temp_input_path = None
                    
                    try:
                        with tempfile.NamedTemporaryFile(mode='w+', suffix='.txt', delete=False) as tmp_file:
                            temp_input_path = tmp_file.name
                        
                        await asyncio.to_thread(self.minio_client.download_file, file_entry, temp_input_path)
                        
                        # Run the solver
                        result = self._solve_instance(temp_input_path, solver, heuristic, request.time_limit)
                        result['instance'] = filename
                        
                        results[solver][key].append(result)
                    except Exception as e:
                        results[solver][key].append({
                            'instance': filename,
                            'return_code': 1,
                            'error': str(e),
                            'duration': 0,
                            'status': 'ERROR'
                        })
                    finally:
                        if temp_input_path and os.path.exists(temp_input_path):
                            os.unlink(temp_input_path)
                            
        job['status'] = 'completed'
        job['summary'] = results
        job['completion_time'] = datetime.now().isoformat()
        await asyncio.to_thread(self._save_job, job)

    def get_result(self, job_id: str) -> BenchmarkResult | None:
        try:
            content = self.minio_client.get_file_content(f"results/benchmarks/{job_id}.json")
            data = json.loads(content)
            return BenchmarkResult(**data)
        except Exception:
            return None

    def list_results(self) -> list[BenchmarkResult]:
        results = []
        try:
            files = self.minio_client.list_files()
            # Filter for results/ prefix and .json suffix
            result_files = [f for f in files if f.startswith("results/benchmarks/") and f.endswith(".json")]
            
            for f in result_files:
                try:
                    content = self.minio_client.get_file_content(f)
                    data = json.loads(content)
                    # Filter only benchmark results (check if request has test_dir)
                    if 'request' in data and 'test_dir' in data['request']:
                        results.append(BenchmarkResult(**data))
                except Exception:
                    continue
        except Exception as e:
            print(f"Error listing results: {e}")
            
        return sorted(results, key=lambda x: x.submit_time, reverse=True)
