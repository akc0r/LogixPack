const API_URL = "http://localhost:8000";

export interface InstanceStats {
  filename: string;
  vehicle_L: number;
  vehicle_W: number;
  vehicle_H: number;
  num_items: number;
}

export interface Item {
  id: number;
  width: number;
  height: number;
  depth: number;
  delivery_order: number;
}

export interface InstanceDetails extends InstanceStats {
  items: Item[];
}

export interface SimulationResult {
  job_id: string;
  status: string;
  submit_time: string;
  completion_time?: string;
  result?: any;
  request?: any;
}

export interface BenchmarkResult {
  job_id: string;
  status: string;
  submit_time: string;
  completion_time?: string;
  summary?: any;
}

export async function listInstances(): Promise<InstanceStats[]> {
  const res = await fetch(`${API_URL}/instances/`);
  if (!res.ok) throw new Error("Failed to fetch instances");
  return res.json();
}

export async function getInstanceDetails(filename: string): Promise<InstanceDetails> {
  const res = await fetch(`${API_URL}/instances/${filename}`);
  if (!res.ok) throw new Error("Failed to fetch instance details");
  return res.json();
}

export async function uploadInstance(file: File): Promise<InstanceStats> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/instances/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload instance");
  return res.json();
}

export async function deleteInstance(filename: string): Promise<void> {
  const res = await fetch(`${API_URL}/instances/${filename}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete instance");
}

export async function runSimulation(filename: string, solver: string, heuristic?: string, timeLimit?: number): Promise<SimulationResult> {
  const res = await fetch(`${API_URL}/simulations/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, solver, heuristic, time_limit: timeLimit }),
  });
  if (!res.ok) throw new Error("Failed to start simulation");
  return res.json();
}

export async function getSimulationResult(jobId: string): Promise<SimulationResult> {
  const res = await fetch(`${API_URL}/simulations/${jobId}`);
  if (!res.ok) throw new Error("Failed to get simulation result");
  return res.json();
}

export async function listSimulations(): Promise<SimulationResult[]> {
  const res = await fetch(`${API_URL}/simulations/`);
  if (!res.ok) throw new Error("Failed to fetch simulations");
  return res.json();
}

export async function runBenchmark(testDir: string, solvers: string[], heuristics: string[], timeLimit?: number, files?: string[]): Promise<BenchmarkResult> {
  const res = await fetch(`${API_URL}/benchmarks/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ test_dir: testDir, solvers, heuristics, time_limit: timeLimit, files }),
  });
  if (!res.ok) throw new Error("Failed to start benchmark");
  return res.json();
}

export async function getBenchmarkResult(jobId: string): Promise<BenchmarkResult> {
  const res = await fetch(`${API_URL}/benchmarks/${jobId}`);
  if (!res.ok) throw new Error("Failed to get benchmark result");
  return res.json();
}

export async function listBenchmarks(): Promise<BenchmarkResult[]> {
  const res = await fetch(`${API_URL}/benchmarks/`);
  if (!res.ok) throw new Error("Failed to fetch benchmarks");
  return res.json();
}
