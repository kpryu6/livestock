# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "db_instance_identifier" {
  description = "Identifier for the RDS instance"
  type        = string
  default     = "rds-instance-ryu"
}

variable "db_allocated_storage" {
  description = "The allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_instance_class" {
  description = "The instance type of the RDS instance"
  type        = string
  default     = "db.t3.medium"
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}

variable "availability_zones" {
  description = "List of availability zones to deploy resources in"
  type        = list(string)
  default     = ["ap-northeast-1a", "ap-northeast-1c", "ap-northeast-1d"]
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.10.0.0/16"
}
