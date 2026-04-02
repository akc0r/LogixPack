from typing import Annotated
from fastapi import Depends

from src.infrastructure import MinioClient
from src.services import BinPacking3DBenchmark, BinPacking3DSimulation

def get_minio_client() -> MinioClient:
    """
    Dependency provider for MinioClient.
    """
    return MinioClient()

def get_simulation_service() -> BinPacking3DSimulation:
    """
    Dependency provider for BinPacking3DSimulation.
    """
    return BinPacking3DSimulation()

def get_benchmark_service() -> BinPacking3DBenchmark:
    """
    Dependency provider for BinPacking3DBenchmark.
    """
    return BinPacking3DBenchmark()

# Type aliases for easier use in endpoints
MinioClientDep = Annotated[MinioClient, Depends(get_minio_client)]
SimulationServiceDep = Annotated[BinPacking3DSimulation, Depends(get_simulation_service)]
BenchmarkServiceDep = Annotated[BinPacking3DBenchmark, Depends(get_benchmark_service)]
