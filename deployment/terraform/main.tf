# Terraform configuration for verifAI LLM Security Scanner
# Supports AWS, Azure, and GCP deployments

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    # Uncomment the provider you're using:
    # aws = {
    #   source  = "hashicorp/aws"
    #   version = "~> 5.0"
    # }
    # azurerm = {
    #   source  = "hashicorp/azurerm"
    #   version = "~> 3.0"
    # }
    # google = {
    #   source  = "hashicorp/google"
    #   version = "~> 5.0"
    # }
  }
  
  # Configure your backend (S3, GCS, Azure Storage, etc.)
  # backend "s3" {
  #   bucket = "your-terraform-state"
  #   key    = "verifai/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

# Variables
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "region" {
  description = "Cloud provider region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "verifai"
}

# Example AWS Resources (uncomment and configure as needed)
# 
# # VPC and Networking
# resource "aws_vpc" "main" {
#   cidr_block           = "10.0.0.0/16"
#   enable_dns_hostnames = true
#   enable_dns_support   = true
#   
#   tags = {
#     Name = "${var.app_name}-vpc"
#     Environment = var.environment
#   }
# }
# 
# # RDS PostgreSQL Database
# resource "aws_db_instance" "postgres" {
#   identifier     = "${var.app_name}-postgres"
#   engine         = "postgres"
#   engine_version = "15.4"
#   instance_class = "db.t3.micro"
#   allocated_storage = 20
#   storage_type   = "gp3"
#   
#   db_name  = "verifai"
#   username = "verifai_admin"
#   password = var.db_password  # Use secrets manager in production
#   
#   vpc_security_group_ids = [aws_security_group.rds.id]
#   db_subnet_group_name   = aws_db_subnet_group.main.name
#   
#   backup_retention_period = 7
#   backup_window          = "03:00-04:00"
#   maintenance_window     = "mon:04:00-mon:05:00"
#   
#   tags = {
#     Name = "${var.app_name}-postgres"
#     Environment = var.environment
#   }
# }
# 
# # ElastiCache Redis
# resource "aws_elasticache_cluster" "redis" {
#   cluster_id           = "${var.app_name}-redis"
#   engine               = "redis"
#   node_type            = "cache.t3.micro"
#   num_cache_nodes      = 1
#   parameter_group_name = "default.redis7"
#   port                 = 6379
#   
#   subnet_group_name    = aws_elasticache_subnet_group.main.name
#   security_group_ids   = [aws_security_group.redis.id]
#   
#   tags = {
#     Name = "${var.app_name}-redis"
#     Environment = var.environment
#   }
# }
# 
# # ECS Cluster for Backend
# resource "aws_ecs_cluster" "backend" {
#   name = "${var.app_name}-backend-cluster"
#   
#   setting {
#     name  = "containerInsights"
#     value = "enabled"
#   }
#   
#   tags = {
#     Name = "${var.app_name}-backend"
#     Environment = var.environment
#   }
# }
# 
# # Application Load Balancer
# resource "aws_lb" "main" {
#   name               = "${var.app_name}-alb"
#   internal           = false
#   load_balancer_type = "application"
#   security_groups    = [aws_security_group.alb.id]
#   subnets            = aws_subnet.public[*].id
#   
#   enable_deletion_protection = var.environment == "prod"
#   
#   tags = {
#     Name = "${var.app_name}-alb"
#     Environment = var.environment
#   }
# }

# Outputs
output "deployment_instructions" {
  value = <<-EOT
    verifAI Infrastructure Configuration
    
    This Terraform configuration is a template. To use it:
    
    1. Uncomment and configure the provider for your cloud (AWS, Azure, GCP)
    2. Configure backend state storage
    3. Set up variables in terraform.tfvars
    4. Review and customize resources for your needs
    5. Run: terraform init && terraform plan && terraform apply
    
    For detailed deployment instructions, see:
    - PRODUCTION.md
    - deployment/k8s/ for Kubernetes deployments
    - deployment/ansible/ for on-premises deployments
  EOT
}
