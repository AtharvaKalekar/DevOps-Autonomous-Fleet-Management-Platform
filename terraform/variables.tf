variable "aws_region" {
  description = "Target AWS provisioning region"
  type        = string
  default     = "us-west-2"
}

variable "s3_bucket_name" {
  description = "Unique globally identifier for telemetry data archives"
  type        = string
  default     = "fleet-telemetry-archive-bucket-2026"
}
