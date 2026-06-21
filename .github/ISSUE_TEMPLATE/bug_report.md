name: Bug report
description: Create a report to help us improve the platform stability
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        Please fill out this form as accurately as possible to help us debug and resolve the problem.
  - type: textarea
    id: bug-description
    attributes:
      label: Bug Description
      description: A clear and concise description of what the bug is.
    validations:
      required: true
  - type: textarea
    id: reproduction-steps
    attributes:
      label: Steps to Reproduce
      description: Explain how to recreate the bug.
      placeholder: |
        1. Deploy stack locally
        2. View 'Vehicles' page
        3. Click 'View Details' on device 'Truck-001'
        4. See telemetry line chart fail to load
    validations:
      required: true
  - type: textarea
    id: expected-behavior
    attributes:
      label: Expected Behavior
      description: What did you expect to happen?
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Relevant System Logs / Error Output
      description: Paste backend logs, docker logs, or browser console errors here.
      render: shell
  - type: input
    id: environment
    attributes:
      label: Environment Info
      description: e.g. macOS Docker Desktop, AWS EKS NodeGroup, local node build
      placeholder: Docker Desktop v4.26 (Alpine Node 20)
