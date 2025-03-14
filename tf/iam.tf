# ✅ EKS의 OIDC 프로바이더 가져오기
data "aws_eks_cluster" "eks" {
  name = module.eks.cluster_name 

  depends_on = [
    module.eks  # ✅ EKS 클러스터 생성 후 실행되도록 설정
  ]
}

data "aws_eks_cluster_auth" "eks" {
  name = module.eks.cluster_name
  depends_on = [
    module.eks  # ✅ EKS 클러스터 생성 후 실행되도록 설정
  ]
}

# ✅ OIDC URL에서 "https://" 제거
locals {
  oidc_url = replace(data.aws_eks_cluster.eks.identity[0].oidc[0].issuer, "https://", "")
}

data "aws_iam_openid_connect_provider" "eks_oidc" {
  url = data.aws_eks_cluster.eks.identity[0].oidc[0].issuer
  depends_on = [
    module.eks  # ✅ EKS 클러스터 생성 후 OIDC Provider 가져오기
  ]
}


# ✅ AWS Secrets Manager 접근 권한을 부여할 IAM Policy
resource "aws_iam_policy" "eks_secrets_manager_policy" {
  name        = "EKSSecretsManagerPolicy"
  description = "Policy to allow EKS ServiceAccount to access AWS Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
        Resource = [
          "arn:aws:secretsmanager:ap-northeast-1:396913715402:secret:prod/livestock/rds/ryu-3nn1TW",
          "arn:aws:secretsmanager:ap-northeast-1:396913715402:secret:prod/springboot/config-HuEyvy"
        ]
      }
    ]
  })
}


# ✅ AWS IAM Role 생성 및 OIDC Provider 연결
resource "aws_iam_role" "eks_secrets_manager_role" {
  name = "EKSSecretsManagerRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = data.aws_iam_openid_connect_provider.eks_oidc.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${local.oidc_url}:sub" = "system:serviceaccount:default:eks-sa"
          }
        }
      }
    ]
  })
  depends_on = [
    module.eks  # ✅ EKS 클러스터가 생성된 후 IAM Role을 생성
  ]
}

# ✅ 생성한 IAM Policy를 Role에 연결
resource "aws_iam_role_policy_attachment" "eks_secrets_manager_attach" {
  policy_arn = aws_iam_policy.eks_secrets_manager_policy.arn
  role       = aws_iam_role.eks_secrets_manager_role.name
}

# EKS Node Group의 IAM Role 가져오기
data "aws_iam_role" "node_group_1_role" {
  name = module.eks.eks_managed_node_groups["one"].iam_role_name
  depends_on = [module.eks]
}

data "aws_iam_role" "node_group_2_role" {
  name = module.eks.eks_managed_node_groups["two"].iam_role_name
  depends_on = [module.eks]
}

# ✅ 생성한 IAM Policy를 모든 Node Group IAM Role에 연결
resource "aws_iam_role_policy_attachment" "node_group_1_secrets_manager_attach" {
  policy_arn = aws_iam_policy.eks_secrets_manager_policy.arn
  role       = data.aws_iam_role.node_group_1_role.name  # ✅ 정확한 Role 이름 사용
}

resource "aws_iam_role_policy_attachment" "node_group_2_secrets_manager_attach" {
  policy_arn = aws_iam_policy.eks_secrets_manager_policy.arn
  role       = data.aws_iam_role.node_group_2_role.name  # ✅ 정확한 Role 이름 사용
}


