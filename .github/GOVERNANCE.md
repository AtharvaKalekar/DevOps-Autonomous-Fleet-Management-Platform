# GitHub Governance & Multi-Team Development Model

This document outlines the repository management, branch protection rules, and permission controls established for the Autonomous Fleet Management Platform.

---

## 1. Multi-Team Division of Responsibilities

To support secure, decoupled operations across the engineering lifecycle, the team is partitioned into three GitHub Teams:

1. **`fleet-dev` (Core Application Development)**:
   - **Access**: Write permissions to `backend/` and `frontend/` directories.
   - **Responsibilities**: Frontend UI widgets, simulator optimization, controllers, REST endpoints, and WebSocket message formats.
2. **`fleet-devops` (Infrastructure & Platforms)**:
   - **Access**: Write permissions to `terraform/`, `k8s/`, `monitoring/`, `docker-compose.yml`, and `Jenkinsfile`.
   - **Responsibilities**: Continuous integration setups, EKS cluster sizing, monitoring telemetry thresholds, and resource provisioning.
3. **`fleet-sec` (Security & Governance)**:
   - **Access**: Write access to security policy credentials and Vault secret access keys.
   - **Responsibilities**: Branch protection policy audits, secret scanning, SSL verification, and secret access tokens audits.

---

## 2. Branching Strategy (GitFlow)

The repository follows a clean GitFlow branching model:

- **`main`**: Production-ready code. Directly mapped to production EKS cluster. Changes are only pushed via PRs from `develop`.
- **`develop`**: Integration branch for pre-release builds.
- **`feature/*`**: Development branches created by `fleet-dev` or `fleet-devops` for specific modifications. Merged into `develop` via PRs.
- **`hotfix/*`**: Immediate patches targeting issues on `main`.

---

## 3. Branch Protection Rules

The following protection configurations are enforced for the `main` and `develop` branches:

- **Required Approvals**: Every Pull Request must receive at least **2 approvals** from the respective team leads before merge access is granted.
- **Required Status Checks**: The Jenkins CI pipeline (`Jenkinsfile`) must pass successfully (building, linting, and dry-run Kubernetes validation).
- **No Direct Pushes**: Pushing directly to `main` or `develop` is strictly prohibited.
- **No Force Pushes**: Administrative overrides are blocked to maintain chronological audit logs.
- **Signed Commits Enforced**: Commits must be GPG signed to verify the committer identity.
