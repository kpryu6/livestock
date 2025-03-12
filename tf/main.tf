# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

provider "aws" {
  region = var.region
}

# Filter out local zones, which are not currently supported 
# with managed node groups
data "aws_availability_zones" "available" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

locals {
  cluster_name = "eks-ryu"
}


module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.8.1"

  name = "vpc-ryu"

  cidr = "10.10.0.0/16"
  azs  = slice(data.aws_availability_zones.available.names, 0, 3)

  private_subnets = ["10.10.1.0/24", "10.10.2.0/24", "10.10.3.0/24"]
  public_subnets  = ["10.10.4.0/24", "10.10.5.0/24", "10.10.6.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.8.5"

  cluster_name    = local.cluster_name
  cluster_version = "1.31"

  cluster_endpoint_public_access           = true
  enable_cluster_creator_admin_permissions = true

  cluster_addons = {
    aws-ebs-csi-driver = {
      service_account_role_arn = module.irsa-ebs-csi.iam_role_arn
    }
  }

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_group_defaults = {
    ami_type = "AL2_x86_64"

  }

  eks_managed_node_groups = {
    one = {
      name = "node-group-1"

      instance_types = ["t3.small"]

      min_size     = 1
      max_size     = 3
      desired_size = 2
    }

    two = {
      name = "node-group-2"

      instance_types = ["t3.small"]

      min_size     = 1
      max_size     = 2
      desired_size = 1
    }
  }
}


# https://aws.amazon.com/blogs/containers/amazon-ebs-csi-driver-is-now-generally-available-in-amazon-eks-add-ons/ 
data "aws_iam_policy" "ebs_csi_policy" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

module "irsa-ebs-csi" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version = "5.39.0"

  create_role                   = true
  role_name                     = "AmazonEKSTFEBSCSIRole-${module.eks.cluster_name}"
  provider_url                  = module.eks.oidc_provider
  role_policy_arns              = [data.aws_iam_policy.ebs_csi_policy.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
}

###### RDS ######

### RDS 보안 그룹 ###
resource "aws_security_group" "rds_sg" {
  vpc_id = module.vpc.vpc_id
  name   = "rds-security-group"

  # EKS와 RDS 간의 통신 허용
  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "rds-security-group" }
}

### RDS DB 인스턴스 ###
resource "aws_db_instance" "rds" {
  identifier             = var.db_instance_identifier
  allocated_storage      = var.db_allocated_storage
  storage_type           = "gp2"
  engine                = "mysql"
  engine_version        = "8.0"
  instance_class        = var.db_instance_class
  username              = var.db_username
  password              = var.db_password
  db_subnet_group_name  = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible   = false
  skip_final_snapshot   = true  # 종료 시 백업 스냅샷 생략

  tags = { Name = "rds-mysql-ryu" }
}

### RDS 전용 서브넷 (각 AZ별로 배포) ###
resource "aws_subnet" "rds_private_subnet" {
  count             = length(var.availability_zones)
  vpc_id           = module.vpc.vpc_id
  cidr_block       = cidrsubnet(var.vpc_cidr, 8, count.index + 10)  # EKS 서브넷과 겹치지 않도록 설정
  availability_zone = var.availability_zones[count.index]

  tags = { Name = "rds-private-subnet-${count.index}" }
}

resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "rds-subnet-group"
  subnet_ids = aws_subnet.rds_private_subnet[*].id

  tags = { Name = "rds-subnet-group" }
}

