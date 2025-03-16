## 프로젝트 소개

| 개발 : 2024.12.06 - 2025.1.16
| 운영 및 자동화 : 2025.1.17 - 2025.03.24

실시간 주식 시세 조회 서비스 프로젝트

</br>

## 목표
**1. 개발 및 운영 환경에서의 로드 밸런싱 및 스케일링 테스트 실행 (AWS ECS 및 EKS)**

- 로드 밸런싱 전략 수립
- 자동 확장 최적화
  
**2. 고가용성 및 재해 복구를 고려한 클라우드 서비스의 오류 대응 전략 개발**

**3. 실시간 모니터링 시스템과 경보 설정을 통한 운영 효율성 향상**

**4. 데이터 보호 및 프라이버시 관리**

- ALB를 통한 웹 공격(SQL Injection, XSS 등) 보호
- Kafka, Redis, RDS 데이터 암호화
  
**5. CI/CD 파이프라인 구축 및 관리**

- Github Actions 기반 CI/CD -> AWS ECS
- Github Actions 기반 CI, GitOps를 통한 ArgoCD -> AWS EKS
  
**6. 인프라 코드화 및 자동화**
- Terraform
- Ansible

</br>

## 기술 스택

Front: React(v18.3.1)

Back: SpringBoot(3.4.0), Java(17)

- Dependency: web, h2, lombok, Slf4j, springdata JPA

DB: Redis(7.4) & MySQL(8.0)

Message Queue: Kafka(3.8)

Infra: ECS 및 EKS, ALB, RDS, SNS, Lambda, Fargate, Route53

Monitoring: CloudWatch

## 브랜치전략 & 커밋컨벤션

### Branch Convention

`HEADER/{내용}` 

e.g. `master`, `develop`, `feature/login`

|HEADER|설명|
|:--:|:--:|
|master|기준이 되는 브랜치|
|develop|개발 브랜치. feature 브랜치에서 작업한 기능이 merge되는 브랜치|
|feature|기능 단위로 개발하는 브랜치. 기능 개발이 완료되면 develop 브랜치에 merge|

### Commit Convention

`HEADER: {내용}` 

e.g. `feat: 로그인 기능 구현`

|HEADER|설명|
|:--:|:--:|
|feat|새로운 기능 구현|
|refactor|내부 로직은 변경하지 않고 기존 코드 리팩토링|
|fix|버그, 오류, 충돌 해결|
|add|feat 이외의 부수적인 코드 추가, 라이브러리 추가 작업|
|update|기능 수정|
|chore|잡일. 버전 코드 수정, 패키지 구조 변경, 파일 이동, 가독성이나 변수명 수정|

## 아키텍처
![Architecture](https://github.com/user-attachments/assets/aa5f5ada-49ec-4e8c-97b9-ba9345a1812b)


## 나의 역할

|이름|Github|역할|
|:------:|:---:|:---:|
|[류경표](https://github.com/kpryu6)|<img src="https://avatars.githubusercontent.com/u/113777043?v=4" height=90 width=90></img>|팀장|

### Frontend 개발
- WebSocketProvider를 통해 웹소켓을 열어 실시간 데이터들을 새로고침 없이 렌더링
- 웹소켓 연결에 상관없이 페이지에 데이터가 없을 시 Redis에서 Fallback 처리로 데이터 가져옴
- [받아온 데이터는 하나의 데이터 형식으로 관리](https://www.notion.so/Frontend-1b82dd0a5224808d8812c210ae3faf07?pvs=4#220aec0233c7407fa0748842e8149bdd)
  
  ```json
  {
  "005930": [
    { "stockId": "005930", "currentPrice": "56400", ... }, 
    { "stockId": "005930", "currentPrice": "56300", ... }, 
    ...
  ],
  "035420": [
    { "stockId": "035420", "currentPrice": "75500", ... },
    ...
  ]
  }
  ```

### Backend 개발
- AWS SDK와 AWS Secrets Manager를 이용하여 한국투자증권 API를 사용하기 위한 민감정보를 안전하게 관리
- 한국투자증권 API의 실시간 웹소켓 데이터를 Kafka에 저장, 전달
- Redis와 Frontend의 WebSocket을 Kafka Consumer로 구성하여 데이터를 소비
- Redis에는 각 종목 당 5개의 데이터만 FIFO 방식으로 저장

### [CI/CD]((.github/workflows))
- ECS 기반 Github Actions CI/CD
- EKS 기반 Github Actions CI
- [ArgoCD를 사용하여 Kubernetes 클러스터 관리 및 배포 자동화](k8s/)
  
### 인프라 코드화
- VPC, Subnet, IGW, NAT, Routing Table, EKS(Module), RDS, IAM 등의 AWS 리소스를 코드화하여 배포 자동화
- EKS OIDC Provider와 IRSA를 이용하여 Pod가 AWS Secrets Manager에 접근할 수 있도록 구성 (SecretProviderClass, Secrets Store CSI Driver)
- Ansible을 이용하여 Ingress Controller를 생성, Helm을 통한 Redis 및 Kafka 설치

## 주요 기능
- **한국투자증권 API에서 불러온 실시간 체결 데이터 조회 가능**
  
  <img width="1097" alt="Image" src="https://github.com/user-attachments/assets/2b2a8c61-2ee7-406e-94e1-597e95157eaa" />
  
- **각 종목을 검색하여 관련 데이터 확인 가능**

  <img width="1090" alt="Image" src="https://github.com/user-attachments/assets/b14f42c9-7a62-4e95-b102-3cec2748b045" />
  
- **각 종목에 대한 디테일 페이지에서 실시간 체결 데이터와 일별 데이터 조회 가능**

  <img width="1090" alt="Image" src="https://github.com/user-attachments/assets/a3b78e7d-619c-416e-a891-89d651e9f811" />
