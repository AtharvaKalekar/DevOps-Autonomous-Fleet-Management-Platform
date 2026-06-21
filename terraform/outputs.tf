output "vpc_id" {
  description = "Assigned VPC Identifier"
  value       = aws_vpc.fleet_vpc.id
}

output "eks_cluster_name" {
  description = "Assigned EKS Cluster Name"
  value       = aws_eks_cluster.eks.name
}

output "eks_cluster_endpoint" {
  description = "AWS API Endpoint for EKS control connection"
  value       = aws_eks_cluster.eks.endpoint
}

# output "kinesis_stream_name" {
#   description = "Assigned Kinesis Ingest Stream Name"
#   value       = aws_kinesis_stream.telemetry_stream.name
# }

output "s3_archive_bucket_arn" {
  description = "Persistent telemetry logs bucket ARN reference"
  value       = aws_s3_bucket.archive_bucket.arn
}
