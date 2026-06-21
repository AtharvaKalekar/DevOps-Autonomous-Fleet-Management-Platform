# Autonomous Vehicle Tracking & Fleet Analytics Platform

An enterprise-grade, full-stack real-time fleet management system simulating a logistics network of 150,000+ autonomous vehicles (scaled to 20 for simulation). This system is designed as a DevOps Case Study to demonstrate containerization, infrastructure-as-code, orchestration, monitoring, and automated pipelines.

---

## Technical Architecture & Stack

- **Frontend**: React.js (v19), Tailwind CSS, Leaflet.js (light map tiles), Recharts (gradient AreaCharts), Lucide React (icons), and Axios (REST calls).
- **Backend**: Node.js + Express.js and WS (native WebSockets server).
- **Databases**:
  - **PostgreSQL**: For persistent data (`vehicles`, `telemetry` logs, and `alerts`).
  - **Redis**: For caching live real-time vehicle telemetry (`telemetry:{vehicleId}` keys) to enable high-throughput telemetry writes.
- **Simulator**: Node.js simulation engine that runs concurrently inside the backend. It seeds 20 vehicles, handles coordinate transitions, and periodically commits state. It also features a **Regional Network Outage (Chaos Engine)** to simulate connectivity failures in Asia, Europe, and North America.
- **Monitoring & Security**: Prometheus (metrics), Grafana (analytics dashboards), and HashiCorp Vault (secrets control).

---

## Directory Structure

```text
fleet-management/
├── backend/                  # REST APIs & simulator source code
├── frontend/                 # React client SPA code
├── terraform/                # Terraform cloud provisioning scripts
│   ├── main.tf               # VPC, EKS, Kinesis, S3 resource definitions
│   ├── variables.tf          # Config inputs
│   └── outputs.tf            # Deployment outputs
├── k8s/                      # Kubernetes orchestration manifests
│   ├── db-deployment.yaml    # Postgres & Redis deployments with PVCs
│   ├── backend-deployment.yaml # Node replicas and NodePort Service
│   ├── frontend-deployment.yaml # Nginx replicas and NodePort Service
│   └── hpa.yaml              # Horizontal Pod Autoscaling limits
├── monitoring/               # Monitoring configuration
│   └── prometheus.yml        # Prometheus targets config
├── .github/                  # Team repo governance configs
│   ├── GOVERNANCE.md         # Team permissions, GitFlow guidelines
│   ├── PULL_REQUEST_TEMPLATE.md # Pull request layout checklist
│   └── ISSUE_TEMPLATE/       # Bug report issue template
├── Jenkinsfile               # Declarative automated CI/CD pipeline
├── docker-compose.yml        # Docker composition stack
└── README.md                 # Project documentation
```

---

## DB Persistence Schema

### Table: `vehicles`
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `type` (ENUM: `'truck'`, `'van'`, `'autonomous'`)
- `status` (ENUM: `'active'`, `'idle'`, `'maintenance'`, `'offline'`)
- `region` (VARCHAR - `'Asia'`, `'Europe'`, `'North America'`)
- `assigned_route` (VARCHAR)
- `created_at` (TIMESTAMP)

### Table: `telemetry`
- `id` (UUID, Primary Key)
- `vehicle_id` (FK → `vehicles`)
- `latitude` / `longitude` (DOUBLE PRECISION)
- `speed` (DOUBLE PRECISION - km/h)
- `fuel_level` (DOUBLE PRECISION - 0–100%)
- `engine_temp` (DOUBLE PRECISION - °C)
- `battery_voltage` (DOUBLE PRECISION)
- `timestamp` (TIMESTAMP)

### Table: `alerts`
- `id` (UUID, Primary Key)
- `vehicle_id` (FK → `vehicles`)
- `type` (ENUM: `'speeding'`, `'low_fuel'`, `'engine_warning'`, `'offline'`, `'maintenance_due'`)
- `severity` (ENUM: `'low'`, `'medium'`, `'high'`, `'critical'`)
- `message` (TEXT)
- `resolved` (BOOLEAN, default false)
- `created_at` (TIMESTAMP)

---

## REST API Endpoints

- `GET    /api/vehicles`              → Retrieves all vehicles merged with their latest live telemetry.
- `GET    /api/vehicles/:id`          → Retrieves detailed metadata and telemetry for a single vehicle.
- `PATCH  /api/vehicles/:id/status`   → Manually override vehicle status.
- `GET    /api/telemetry/:vehicleId`  → Retrieves the last 50 telemetry points (ordered chronologically).
- `GET    /api/alerts`                → Retrieves all unresolved active alerts.
- `PATCH  /api/alerts/:id/resolve`    → Resolves a specific alert, broadcasting the event.
- `GET    /api/stats`                 → Retrieves stats aggregates (Active count, Offline count, etc.).
- `POST   /api/simulator/outage`      → Trigger or stop a regional connectivity outage (`{ region, active }`).
- `GET    /api/simulator/outage`      → Fetch current active regional outage states.

---

## How to Run

### Option 1: Running the Complete Stack (Docker Compose)

1. Make sure you have Docker Desktop running.
2. Navigate to the `fleet-management` directory:
   ```bash
   cd fleet-management
   ```
3. Boot all 7 services (Backend, Frontend, Postgres, Redis, Prometheus, Grafana, Vault):
   ```bash
   docker-compose up --build -d
   ```
4. Access the applications:
   - **Frontend UI Client**: [http://localhost:3000](http://localhost:3000)
   - **Backend REST API**: [http://localhost:4000/api](http://localhost:4000/api)
   - **Prometheus Monitoring**: [http://localhost:9090](http://localhost:9090)
   - **Grafana Dashboards**: [http://localhost:3001](http://localhost:3001) (Admin Password: `admin`)
   - **HashiCorp Vault**: [http://localhost:8200](http://localhost:8200) (Root Token: `myroottoken`)

---

## DevOps Pipeline & Infrastructure Details

### 1. Terraform Cloud Provisioning
The `terraform/` configurations define production AWS resources:
- **VPC & Networking**: Multi-AZ public subnets with Internet Gateway and route tables.
- **Amazon EKS**: Kubernetes cluster control plane and worker nodegroup (scalable from 2 to 5 nodes).
- **Amazon Kinesis**: A data ingestion stream with 4 shards to absorb high-volume vehicle telemetry events.
- **Amazon S3 & IoT Core**: Ingestion topic rule capturing messages and archiving telemetry logs in private S3 buckets.
- **CloudWatch Monitoring**: Diagnostic alerts for exceeded throughput and read failures.

### 2. Kubernetes Orchestration
The EKS deployments (`k8s/`) configure scalable workloads:
- `db-deployment.yaml`: Postgres (with 5Gi persistent volume claim) and Redis cache.
- `backend-deployment.yaml`: Node pods (2 replicas) with CPU/memory resource limits and NodePort configuration.
- `frontend-deployment.yaml`: Nginx client pods serving static build files.
- `hpa.yaml`: Horizontal Pod Autoscaler dynamically scaling backend replicas (up to 10 instances) when CPU usage exceeds 80%.

### 3. Jenkins CI/CD Pipeline
The `Jenkinsfile` configures a declarative multi-stage delivery pipeline:
- **Lint & Verify**: Checks code consistency for backend and frontend code.
- **Vite compilation**: Compiles React assets.
- **Docker builds**: Compiles `fleet-management-backend` and `fleet-management-frontend` container images.
- **Registry Tagging**: Interfaces with Docker registry hubs.
- **EKS Deploy Dry-Run**: Validates Kubernetes configurations via `kubectl apply --dry-run`.
