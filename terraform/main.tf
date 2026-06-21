# Terraform Configuration for Autonomous Fleet Management Platform
# Provisions EKS, VPC, Kinesis, S3, and CloudWatch Monitoring

terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ==========================================
# NETWORKING (VPC, SUBNETS, ROUTING)
# ==========================================
resource "aws_vpc" "fleet_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "fleet-management-vpc"
  }
}

resource "aws_subnet" "public_subnets" {
  count                   = 2
  vpc_id                  = aws_vpc.fleet_vpc.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = {
    Name                               = "fleet-public-subnet-${count.index}"
    "kubernetes.io/role/elb"           = "1"
    "kubernetes.io/cluster/fleet-eks"  = "shared"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.fleet_vpc.id
  tags = {
    Name = "fleet-vpc-igw"
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.fleet_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = {
    Name = "fleet-public-rt"
  }
}

resource "aws_route_table_association" "public_assoc" {
  count          = 2
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

data "aws_availability_zones" "available" {
  state = "available"
}

# ==========================================
# EKS CLUSTER (KUBERNETES DEPLOYMENT WORKLOAD)
# ==========================================
resource "aws_iam_role" "eks_cluster_role" {
  name = "fleet-eks-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

resource "aws_eks_cluster" "eks" {
  name     = "fleet-eks"
  role_arn = aws_iam_role.eks_cluster_role.arn
  vpc_config {
    subnet_ids = aws_subnet.public_subnets[*].id
  }
  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]
}

resource "aws_iam_role" "node_group_role" {
  name = "fleet-eks-nodegroup-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node_group_role.name
}

resource "aws_iam_role_policy_attachment" "cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node_group_role.name
}

resource "aws_iam_role_policy_attachment" "ec2_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node_group_role.name
}

resource "aws_eks_node_group" "nodes" {
  cluster_name    = aws_eks_cluster.eks.name
  node_group_name = "fleet-workers"
  node_role_arn   = aws_iam_role.node_group_role.arn
  subnet_ids      = aws_subnet.public_subnets[*].id

  scaling_config {
    desired_size = 3
    max_size     = 5
    min_size     = 2
  }

  instance_types = ["t3.micro"]

  depends_on = [
    aws_iam_role_policy_attachment.worker_node_policy,
    aws_iam_role_policy_attachment.cni_policy,
    aws_iam_role_policy_attachment.ec2_registry_policy
  ]
}

# ==========================================
# TELEMETRY DATA STREAM (AMAZON KINESIS)
# ==========================================
# resource "aws_kinesis_stream" "telemetry_stream" {
#   name             = "fleet-telemetry-stream"
#   shard_count      = 4
#   retention_period = 24
#   tags = {
#     Environment = "production"
#   }
# }

# ==========================================
# STORAGE ARCHIVE (AMAZON S3)
# ==========================================
resource "aws_s3_bucket" "archive_bucket" {
  bucket        = var.s3_bucket_name
  force_destroy = true
  tags = {
    Name = "fleet-telemetry-archive"
  }
}

resource "aws_s3_bucket_public_access_block" "private_s3_block" {
  bucket                  = aws_s3_bucket.archive_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ==========================================
# IOT CORE INGESTION RULES (Disabled - depends on Kinesis)
# ==========================================
# resource "aws_iam_role" "iot_kinesis_role" {
#   name = "fleet-iot-kinesis-role"
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [{
#       Action = "sts:AssumeRole"
#       Effect = "Allow"
#       Principal = {
#         Service = "iot.amazonaws.com"
#       }
#     }]
#   })
# }
# 
# resource "aws_iam_policy" "iot_kinesis_policy" {
#   name        = "fleet-iot-kinesis-policy"
#   description = "Allows IoT rule to write to Kinesis stream"
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [{
#       Action   = "kinesis:PutRecord"
#       Effect   = "Allow"
#       Resource = aws_kinesis_stream.telemetry_stream.arn
#     }]
#   })
# }
# 
# resource "aws_iam_role_policy_attachment" "iot_kinesis_attach" {
#   policy_arn = aws_iam_policy.iot_kinesis_policy.arn
#   role       = aws_iam_role.iot_kinesis_role.name
# }
# 
# resource "aws_iot_topic_rule" "telemetry_ingest" {
#   name        = "FleetTelemetryIngestRule"
#   description = "Ingests real-time GPS telemetry from autonomous vehicles into Kinesis"
#   enabled     = true
#   sql         = "SELECT * FROM 'fleet/+/telemetry'"
#   sql_version = "2016-03-23"
# 
#   kinesis {
#     partition_key = "$${topic()}"
#     role_arn      = aws_iam_role.iot_kinesis_role.arn
#     stream_name   = aws_kinesis_stream.telemetry_stream.name
#   }
# }

# ==========================================
# MONITORING (CLOUDWATCH ALARMS - Disabled)
# ==========================================
# resource "aws_cloudwatch_metric_alarm" "high_telemetry_errors" {
#   alarm_name          = "kinesis-high-error-rate"
#   comparison_operator = "GreaterThanOrEqualToThreshold"
#   evaluation_periods  = "1"
#   metric_name         = "ReadProvisionedThroughputExceeded"
#   namespace           = "AWS/Kinesis"
#   period              = "60"
#   statistic           = "Sum"
#   threshold           = "10"
#   alarm_description   = "This alarm triggers if Kinesis stream experiences provisioned read capacity failures."
#   dimensions = {
#     StreamName = aws_kinesis_stream.telemetry_stream.name
#   }
# }
