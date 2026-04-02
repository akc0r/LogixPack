from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .endpoints import instances, simulations, benchmarks

app = FastAPI(title="Bin Packing API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(instances.router)
app.include_router(simulations.router)
app.include_router(benchmarks.router)

@app.get("/")
def root():
    return {"message": "Bin Packing API is running"}

