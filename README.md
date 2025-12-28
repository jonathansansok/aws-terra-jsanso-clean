# Fullstack AWS (Vite + NestJS + Prisma v7 + MySQL)

## Architecture (AWS domains only)
- Frontend (SPA): S3 (private) + CloudFront (default AWS domain)
- Backend: EC2 (public subnet) running Dockerized NestJS
- Database: RDS MySQL (private subnets) accessible only from EC2 SG
- No NAT Gateway (cost control)

## Repo Layout
- aws/front/web: Vite React app (created by `npm create vite@latest web ...`)
- aws/back: NestJS API + Prisma v7
- infra: Terraform (VPC + EC2 + RDS + S3 + CloudFront)
- scripts: operational runbooks (dev/prod)

## Local (Windows 10) - Backend Dev (Docker)
From `aws/back`:

Build:
```bash
docker build -t aws-back:dev --target dev .


Context pack (AWSOK Fullstack) — estado actual
Infra (Terraform apply OK)

AWS Region: us-east-1

CloudFront (Front URL): https://d2hiu34pyeqif1.cloudfront.net/

S3 bucket (front): awsok-fullstack-web-bucket-6c5dfc13

EC2 public IP: 3.226.241.122

EC2 public DNS: ec2-3-226-241-122.compute-1.amazonaws.com

RDS endpoint: awsok-fullstack-mysql.cy3wm4mgygbc.us-east-1.rds.amazonaws.com

Credenciales / perfiles (local)

AWS CLI profile: terraform

Variables de entorno que ya venías usando:

export AWS_PROFILE=terraform

export AWS_REGION=us-east-1

export TF_VAR_db_password="(tu_password)" (no en .tfvars)

SSH KeyPair (EC2)

KeyPair name (AWS): awsok-key

Pem local (Windows): /c/Users/Jonathan/Downloads/awsok-key.pem

SSH (cuando toque):

chmod 400 /c/Users/Jonathan/Downloads/awsok-key.pem

ssh -i /c/Users/Jonathan/Downloads/awsok-key.pem ubuntu@3.226.241.122

Recordatorio importante (estado Terraform)

Tu terraform.tfstate es local (por .gitignore). No lo borres/muevas si querés seguir haciendo apply/destroy sin dolores.

Qué sigue (backend “serio”): orden operativo
Paso 1 — entrar a EC2 y validar base

En EC2 vamos a verificar:

Docker instalado (o instalarlo si tu user_data no lo dejó listo)

Puertos/SG: ideal exponer 80/443 (NGINX) y no dejar 3000 abierto público (opcional si querés rápido)

Conectividad a RDS solo desde EC2 (ya está así por SG)

Checklist en EC2:

docker --version

sudo docker ps

curl -sS localhost:3000/health (cuando esté corriendo)

nslookup awsok-fullstack-mysql.cy3wm4mgygbc.us-east-1.rds.amazonaws.com

Paso 2 — levantar backend en EC2 (docker)

Recomendación pro:

crear /opt/aws-back/.env en EC2 con:

NODE_ENV=production

PORT=3000

CORS_ORIGIN=https://d2hiu34pyeqif1.cloudfront.net

DATABASE_URL=mysql://app_user:<PASS>@awsok-fullstack-mysql.cy3wm4mgygbc.us-east-1.rds.amazonaws.com:3306/app_db

Paso 3 — Prisma migrate contra RDS (sin exponer RDS)

Estrategia simple y correcta:

correr npx prisma migrate deploy desde la EC2, idealmente dentro del contenedor del backend (o con un contenedor “one-off”).

Lo que necesito en la próxima conversación (para blindar scripts con logs)

Pegame tal cual el contenido de:

scripts/20-ec2-back-run.sh

scripts/30-prisma-migrate-ec2.sh

Con eso:

te los dejo “a prueba de balas” (logs explícitos, validaciones, no asumir nada)

definimos contrato de env vars (BACKEND_IMAGE / BACKEND_PORT / DATABASE_URL / CORS_ORIGIN / etc.)

evitamos pasos manuales frágiles

Nota rápida sobre el “aws: command not found” en VSCode

Si en Git Bash normal aws sts get-caller-identity --profile terraform funciona pero en la terminal de VSCode no:

en VSCode elegí terminal Git Bash (no PowerShell/CMD)

o revisá PATH dentro de VSCode: which aws / echo $PATH

Seguridad (importante, sin dramatizar)

Como en este chat se pegaron credenciales en texto plano en un momento: rotá ese Access Key en IAM cuando puedas (Create new → switch → deactivate old). No lo vuelvas a pegar en chats.

Cuando abras la nueva conversación, arrancá pegando:

este “Context pack”

scripts/20-ec2-back-run.sh

scripts/30-prisma-migrate-ec2.sh

Y de ahí seguimos directo con backend + migrate.

## DEBUG BUNDLE - 2025-12-27T18:17:31
// infra\envs\prod.tfvars

aws_region = "us-east-1"
project    = "awsok-fullstack"

# Your public IP CIDR (SSH)
my_ip_cidr = "191.84.220.130/32"

# EC2
ec2_instance_type = "t3.micro"
ec2_key_name      = "awsok-key"

# RDS
db_name              = "app_db"
db_username          = "app_user"
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20

// infra\main.tf

data "aws_availability_zones" "azs" {}

# ----------------------------
# Network (VPC + subnets)
# ----------------------------
resource "aws_vpc" "main" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${var.project}-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-igw" }
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.20.10.0/24"
  availability_zone       = data.aws_availability_zones.azs.names[0]
  map_public_ip_on_launch = true
  tags                    = { Name = "${var.project}-public-a" }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.20.11.0/24"
  availability_zone       = data.aws_availability_zones.azs.names[1]
  map_public_ip_on_launch = true
  tags                    = { Name = "${var.project}-public-b" }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.20.20.0/24"
  availability_zone = data.aws_availability_zones.azs.names[0]
  tags              = { Name = "${var.project}-private-a" }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.20.21.0/24"
  availability_zone = data.aws_availability_zones.azs.names[1]
  tags              = { Name = "${var.project}-private-b" }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-public-rt" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public_rt.id
}

# ----------------------------
# Security Groups
# ----------------------------
resource "aws_security_group" "ec2_sg" {
  name        = "${var.project}-ec2-sg"
  description = "EC2 SG for backend host"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from my IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  ingress {
    description = "HTTP public"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS public"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Optional: if you want direct access to Nest port (not recommended)
  # ingress {
  #   description = "Nest direct (debug only)"
  #   from_port   = 3000
  #   to_port     = 3000
  #   protocol    = "tcp"
  #   cidr_blocks = [var.my_ip_cidr]
  # }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-ec2-sg" }
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.project}-rds-sg"
  description = "RDS SG only from EC2 SG"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL from EC2 SG"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-rds-sg" }
}

# ----------------------------
# RDS (MySQL private)
# ----------------------------
resource "aws_db_subnet_group" "db_subnets" {
  name       = "${var.project}-db-subnets"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

resource "aws_db_instance" "mysql" {
  identifier        = "${var.project}-mysql"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  db_name           = var.db_name
  username          = var.db_username
  password          = var.db_password
  port              = 3306

  publicly_accessible    = false
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name

  skip_final_snapshot = true

  tags = { Name = "${var.project}-mysql" }
}

# ----------------------------
# EC2 (Docker host)
# ----------------------------
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "backend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  key_name               = var.ec2_key_name

  user_data = <<-EOF
    #!/bin/bash
    set -e

    echo "[user_data] start" | tee -a /var/log/user-data.log

    apt-get update -y
    apt-get install -y ca-certificates curl gnupg

    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
      > /etc/apt/sources.list.d/docker.list

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    systemctl enable docker
    systemctl start docker

    mkdir -p /opt/aws-back
    echo "[user_data] docker installed" | tee -a /var/log/user-data.log
  EOF

  tags = { Name = "${var.project}-backend-ec2" }
}

# ----------------------------
# Front: S3 + CloudFront (AWS domain)
# ----------------------------
resource "aws_s3_bucket" "web_bucket" {
  bucket = "${var.project}-web-bucket-${random_id.suffix.hex}"
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_public_access_block" "web_bucket_block" {
  bucket                  = aws_s3_bucket.web_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.project}-oac"
  description                       = "OAC for S3 origin"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.web_bucket.bucket_regional_domain_name
    origin_id                = "s3-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-origin"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
}

data "aws_iam_policy_document" "bucket_policy" {
  statement {
    sid     = "AllowCloudFrontRead"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    resources = ["${aws_s3_bucket.web_bucket.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.cdn.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "web_policy" {
  bucket = aws_s3_bucket.web_bucket.id
  policy = data.aws_iam_policy_document.bucket_policy.json
}

// infra\outputs.tf

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.web_bucket.bucket
}

output "ec2_public_ip" {
  value = aws_instance.backend.public_ip
}

output "ec2_public_dns" {
  value = aws_instance.backend.public_dns
}

output "rds_endpoint" {
  value = aws_db_instance.mysql.address
}

// infra\providers.tf

provider "aws" {
  region  = var.aws_region
  profile = "terraform"
}

// infra\variables.tf

variable "aws_region" { type = string }
variable "project" { type = string }

# Security
variable "my_ip_cidr" {
  type        = string
  description = "Your public IP in CIDR, e.g. 203.0.113.10/32"
}

# EC2
variable "ec2_instance_type" { type = string }
variable "ec2_key_name" {
  type        = string
  description = "Existing EC2 KeyPair name"
}

# RDS
variable "db_name" { type = string }
variable "db_username" { type = string }

variable "db_instance_class" { type = string }
variable "db_allocated_storage" { type = number }

variable "db_password" {
  type      = string
  sensitive = true
}

// infra\versions.tf

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

// keys\awsok-key.pem

-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEA5XwaHL5/PRbuDN3kkYe+x3uzuXvhpTxLJhZLzGt9quIlo31w
mwKgsK77jitNycipq5IttcqtSTapKXzxnvQFQalrJKTPCuoH+kJ+ok1JgaFrOyTv
W5SP9pxdi0t0hjG44JTfXPUi2U6hXesRtu4Jju9lxhmsW98yhg1QWYsAPl+32pR0
w3Ctjpserb0aUCCXtOboSpBi4lsvBQ9+N498Tq5MagqYJTPMVwnHK8d4x0CzmDLQ
Nu3WboGKNS4Qy9WFzk8qHv2KkEptRhUoUGX9aAemDSWQ6PwqrDq8r3caBCBjHCA/
hCq8iOkw8rIVMoJASOkgtEbj4W5dIpMptj0PyQIDAQABAoIBADbzYZlScEtjizsf
gxTqCV/hGicnJ+AWMPR80Eex0ZSytEqSxf0IQwwryma/rc/Msfw4c6OdVaM7aIRb
u8vRKNURSWur3zwA0Eo30/TvRtO4oGG4NWybhWGLDcdGGS/tBhUY8Odkd6TLdE51
9Hb2RumoH5mxGhmht4pr87qNU1CbzOlZa3jySxQvxxXR8cjifX+Or03rMY0DeJmN
zYInZLahyXBjsulyIYF+AN0OoQV+AFHgoNYnIJxiHPzRZcxAaNjscftLogyWRzmE
iw7ueBsPDt289IHAgdBIJwLgOFZf2223IOHcTHPccApVGI1J69ZS1S3XOpC8QYOo
3vXXTAUCgYEA8ttKOQUWXMn94wavPWNOcUe5QTEEDeJwvxq9362hI1z7p8ZStfzI
63FY7yem/9ajQItIgICBYkXRzDes4RTdk6w5+ANFiK9Ds1xZXIAT1yPw3uZJBqKD
NqcwahOQd0c83e9kI0jhIjXTnGa0DD7KJNoalqv1y651mjv1IXAZOQcCgYEA8eeM
lM59fGXBo6NiHBuvBZ7If3+PxDO5u5t0hzISH8AU8bMEhFsRlPdh0VwDZr+5fpof
GtytoMhxuvk1QW+1vvyGhhNXFg36xZixwRafEI+hv+mC3RGNh+7jR+g99KsaugUA
6KZpfVmcfYycKKiCLJ9syJDI4/+B0bK4J9gnTK8CgYAU37Zcekx2w0HYPp3XV+7J
G9IXgWAI1Xq9Yk4JqMHd6UMUI56+V7DpU7/CJpVbDhbQGGit6t20Fa43sF1ip0l4
ROhiod1bJz1ZcEmaAsQxzLwKXJ7QPC2tB+fIZlAXgH8B0G65/aykJR5AJi+5kbgM
PNbmNneU/zTKgfbK3fi9BwKBgCoTMzGCxPLJJCgZN+xZqFSa7Ja4kkH3GTwXaupE
/EAHgd0UXRnEWUeGy73FelX5zQLHPdfHQG/xzU5PIEM0cfE5LRDO9lvArLiHuYsz
KxGPWfvuWrOm5O4az+9m5rfStwBZ9HGC2GBUINL5jQPJY3Lte9daz4ZQn7zgkAVm
JFfDAoGACSAnQ3h5wU37/X4ytFQVnGnHyDgS/dmhK8Nhy3+Lp4GoRnYXzsFD2Wf9
au92m/mxfD1PdcY6NoqFqzen6RzYgoeCmAlQdirr1FrFgOwQP+UCzlwOrhMqRgUw
tbRykVYkhc/K41LLIUD/EggLklreO4QgOsRK/5RhxKM/BrKmltc=
-----END RSA PRIVATE KEY-----

// scripts\00-local-back-dev.sh

#!/usr/bin/env bash
set -euo pipefail

echo "[00-local-back-dev] start"
cd aws/back

echo "[00-local-back-dev] build dev image"
docker build -t aws-back:dev --target dev .

echo "[00-local-back-dev] run dev container"
docker run --rm -p 3000:3000 --name aws-back \
  -e PORT=3000 \
  -e NODE_ENV=development \
  -e CORS_ORIGIN=http://localhost:5173 \
  -e DATABASE_URL="mysql://root@host.docker.internal:3306/app_db" \
  aws-back:dev

// scripts\10-front-build.sh

cat > scripts/10-front-build.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "[front-build] start"

echo "[front-build] cd aws/front/web"
cd aws/front/web

echo "[front-build] node=$(node -v 2>/dev/null || echo 'no-node') npm=$(npm -v 2>/dev/null || echo 'no-npm')"

echo "[front-build] install deps"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "[front-build] build"
npm run build

echo "[front-build] dist summary"
ls -la dist | head -n 20
ls -la dist/assets | head -n 20

echo "[front-build] done"
EOF

chmod +x scripts/10-front-build.sh

// scripts\11-front-deploy-s3.sh

#!/usr/bin/env bash
set -euo pipefail

echo "[front-deploy] start"

AWS_PROFILE="${AWS_PROFILE:-terraform}"
AWS_REGION="${AWS_REGION:-us-east-1}"
S3_BUCKET="${S3_BUCKET:-awsok-fullstack-web-bucket-6c5dfc13}"
CF_DOMAIN="${CF_DOMAIN:-d2hiu34pyeqif1.cloudfront.net}"

echo "[front-deploy] AWS_PROFILE=$AWS_PROFILE AWS_REGION=$AWS_REGION"
echo "[front-deploy] S3_BUCKET=$S3_BUCKET CF_DOMAIN=$CF_DOMAIN"

export AWS_PROFILE AWS_REGION S3_BUCKET CF_DOMAIN

echo "[front-deploy] cd aws/front/web"
cd aws/front/web

echo "[front-deploy] dist exists?"
ls -la dist | head -n 20

echo "[front-deploy] sync -> s3://$S3_BUCKET"
aws s3 sync dist "s3://$S3_BUCKET" --delete

echo "[front-deploy] resolve CF_DIST_ID"
CF_DIST_ID=$(
  aws cloudfront list-distributions \
    --query "DistributionList.Items[?DomainName=='$CF_DOMAIN'].Id | [0]" \
    --output text
)
echo "[front-deploy] CF_DIST_ID=$CF_DIST_ID"

echo "[front-deploy] invalidate"
aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*"

echo "[front-deploy] done"

// scripts\20-ec2-back-run.sh

#!/usr/bin/env bash
set -euo pipefail

echo "[20-ec2-back-run] start"

# Assumes you're already on EC2 with repo available (git clone) OR you copied aws/back folder.
# Also assumes docker is installed (Terraform user_data does it).

cd aws/back

echo "[20-ec2-back-run] build prod image"
docker build -t aws-back:prod --target runtime .

echo "[20-ec2-back-run] ensure env file exists at /opt/aws-back/.env"
if [[ ! -f /opt/aws-back/.env ]]; then
  echo "[20-ec2-back-run] missing /opt/aws-back/.env"
  exit 1
fi

echo "[20-ec2-back-run] stop old container if exists"
docker rm -f aws-back >/dev/null 2>&1 || true

echo "[20-ec2-back-run] run prod container"
docker run -d --name aws-back --restart unless-stopped \
  --env-file /opt/aws-back/.env \
  -p 3000:3000 \
  aws-back:prod

echo "[20-ec2-back-run] logs tail"
docker logs -n 120 aws-back || true

// scripts\30-prisma-migrate-ec2.sh

#!/usr/bin/env bash
set -euo pipefail

echo "[30-prisma-migrate-ec2] start"
echo "[30-prisma-migrate-ec2] running migrate deploy inside container"

docker exec -it aws-back sh -lc "npx prisma migrate deploy"

echo "[30-prisma-migrate-ec2] done"

// aws\front\web\package.json

{
  "name": "web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@tanstack/react-query": "^5.90.12",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.562.0",
    "next-themes": "^0.4.6",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.69.0",
    "react-router-dom": "^7.11.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.4.0",
    "tw-animate-css": "^1.4.0",
    "zod": "^4.2.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@tailwindcss/vite": "^4.1.18",
    "@types/node": "^24.10.1",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.23",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.46.4",
    "vite": "^7.2.4",
    "vite-tsconfig-paths": "^6.0.3"
  }
}

// aws\front\web\vite.config.ts

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths()],
})

// aws\front\web\tsconfig.json

{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

// aws\front\web\tailwind.config.js

export default {
    darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}

// aws\front\web\index.html

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>web</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

// aws\front\web\.env.example

# Local dev (Vite)
VITE_API_BASE_URL=http://localhost:3000

// aws\front\web\.env

VITE_API_BASE_URL=http://localhost:3000

// aws\front\web\src\main.tsx

import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app/App"
import "./index.css"

console.log("[main] boot")

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// aws\back\tsconfig.json

{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "noFallthroughCasesInSwitch": false
  }
}

// aws\back\prisma.config.ts

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});

// aws\back\package.json

{
  "name": "back",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.2",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/swagger": "^11.2.3",
    "@prisma/adapter-mariadb": "^7.2.0",
    "@prisma/client": "^7.2.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.3",
    "mariadb": "^3.4.5",
    "prisma": "^7.2.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.18.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^22.10.7",
    "@types/supertest": "^6.0.2",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^16.0.0",
    "jest": "^30.0.0",
    "prettier": "^3.4.2",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.20.0"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}

// aws\back\.env.example

# Common
PORT=3000

# Local
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=mysql://root@host.docker.internal:3306/app_db

# Prod (example)
# NODE_ENV=production
# CORS_ORIGIN=https://<cloudfront-domain>
# DATABASE_URL=mysql://<user>:<pass>@<rds-endpoint>:3306/app_db

// aws\back\.env

NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=mysql://root@localhost:3306/app_db

// aws\back\src\swagger.ts

import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('AWS Fullstack CRUD API')
  .setDescription('NestJS + Prisma + MySQL | ECS/Fargate-ready')
  .setVersion('1.0.0')
  .addTag('health')
  .addTag('products')
  .addTag('orders')
  .build();
## DEBUG BUNDLE - 2025-12-27T18:17:31
// infra\envs\prod.tfvars

aws_region = "us-east-1"
project    = "awsok-fullstack"

# Your public IP CIDR (SSH)
my_ip_cidr = "191.84.220.130/32"

# EC2
ec2_instance_type = "t3.micro"
ec2_key_name      = "awsok-key"

# RDS
db_name              = "app_db"
db_username          = "app_user"
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20

// infra\main.tf

data "aws_availability_zones" "azs" {}

# ----------------------------
# Network (VPC + subnets)
# ----------------------------
resource "aws_vpc" "main" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${var.project}-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-igw" }
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.20.10.0/24"
  availability_zone       = data.aws_availability_zones.azs.names[0]
  map_public_ip_on_launch = true
  tags                    = { Name = "${var.project}-public-a" }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.20.11.0/24"
  availability_zone       = data.aws_availability_zones.azs.names[1]
  map_public_ip_on_launch = true
  tags                    = { Name = "${var.project}-public-b" }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.20.20.0/24"
  availability_zone = data.aws_availability_zones.azs.names[0]
  tags              = { Name = "${var.project}-private-a" }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.20.21.0/24"
  availability_zone = data.aws_availability_zones.azs.names[1]
  tags              = { Name = "${var.project}-private-b" }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-public-rt" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public_rt.id
}

# ----------------------------
# Security Groups
# ----------------------------
resource "aws_security_group" "ec2_sg" {
  name        = "${var.project}-ec2-sg"
  description = "EC2 SG for backend host"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from my IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  ingress {
    description = "HTTP public"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS public"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Optional: if you want direct access to Nest port (not recommended)
  # ingress {
  #   description = "Nest direct (debug only)"
  #   from_port   = 3000
  #   to_port     = 3000
  #   protocol    = "tcp"
  #   cidr_blocks = [var.my_ip_cidr]
  # }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-ec2-sg" }
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.project}-rds-sg"
  description = "RDS SG only from EC2 SG"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL from EC2 SG"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-rds-sg" }
}

# ----------------------------
# RDS (MySQL private)
# ----------------------------
resource "aws_db_subnet_group" "db_subnets" {
  name       = "${var.project}-db-subnets"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

resource "aws_db_instance" "mysql" {
  identifier        = "${var.project}-mysql"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  db_name           = var.db_name
  username          = var.db_username
  password          = var.db_password
  port              = 3306

  publicly_accessible    = false
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name

  skip_final_snapshot = true

  tags = { Name = "${var.project}-mysql" }
}

# ----------------------------
# EC2 (Docker host)
# ----------------------------
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "backend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  key_name               = var.ec2_key_name

  user_data = <<-EOF
    #!/bin/bash
    set -e

    echo "[user_data] start" | tee -a /var/log/user-data.log

    apt-get update -y
    apt-get install -y ca-certificates curl gnupg

    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
      > /etc/apt/sources.list.d/docker.list

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    systemctl enable docker
    systemctl start docker

    mkdir -p /opt/aws-back
    echo "[user_data] docker installed" | tee -a /var/log/user-data.log
  EOF

  tags = { Name = "${var.project}-backend-ec2" }
}

# ----------------------------
# Front: S3 + CloudFront (AWS domain)
# ----------------------------
resource "aws_s3_bucket" "web_bucket" {
  bucket = "${var.project}-web-bucket-${random_id.suffix.hex}"
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_public_access_block" "web_bucket_block" {
  bucket                  = aws_s3_bucket.web_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.project}-oac"
  description                       = "OAC for S3 origin"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.web_bucket.bucket_regional_domain_name
    origin_id                = "s3-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-origin"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
}

data "aws_iam_policy_document" "bucket_policy" {
  statement {
    sid     = "AllowCloudFrontRead"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    resources = ["${aws_s3_bucket.web_bucket.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.cdn.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "web_policy" {
  bucket = aws_s3_bucket.web_bucket.id
  policy = data.aws_iam_policy_document.bucket_policy.json
}

// infra\outputs.tf

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.web_bucket.bucket
}

output "ec2_public_ip" {
  value = aws_instance.backend.public_ip
}

output "ec2_public_dns" {
  value = aws_instance.backend.public_dns
}

output "rds_endpoint" {
  value = aws_db_instance.mysql.address
}

// infra\providers.tf

provider "aws" {
  region  = var.aws_region
  profile = "terraform"
}

// infra\variables.tf

variable "aws_region" { type = string }
variable "project" { type = string }

# Security
variable "my_ip_cidr" {
  type        = string
  description = "Your public IP in CIDR, e.g. 203.0.113.10/32"
}

# EC2
variable "ec2_instance_type" { type = string }
variable "ec2_key_name" {
  type        = string
  description = "Existing EC2 KeyPair name"
}

# RDS
variable "db_name" { type = string }
variable "db_username" { type = string }

variable "db_instance_class" { type = string }
variable "db_allocated_storage" { type = number }

variable "db_password" {
  type      = string
  sensitive = true
}

// infra\versions.tf

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

// keys\awsok-key.pem

-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEA5XwaHL5/PRbuDN3kkYe+x3uzuXvhpTxLJhZLzGt9quIlo31w
mwKgsK77jitNycipq5IttcqtSTapKXzxnvQFQalrJKTPCuoH+kJ+ok1JgaFrOyTv
W5SP9pxdi0t0hjG44JTfXPUi2U6hXesRtu4Jju9lxhmsW98yhg1QWYsAPl+32pR0
w3Ctjpserb0aUCCXtOboSpBi4lsvBQ9+N498Tq5MagqYJTPMVwnHK8d4x0CzmDLQ
Nu3WboGKNS4Qy9WFzk8qHv2KkEptRhUoUGX9aAemDSWQ6PwqrDq8r3caBCBjHCA/
hCq8iOkw8rIVMoJASOkgtEbj4W5dIpMptj0PyQIDAQABAoIBADbzYZlScEtjizsf
gxTqCV/hGicnJ+AWMPR80Eex0ZSytEqSxf0IQwwryma/rc/Msfw4c6OdVaM7aIRb
u8vRKNURSWur3zwA0Eo30/TvRtO4oGG4NWybhWGLDcdGGS/tBhUY8Odkd6TLdE51
9Hb2RumoH5mxGhmht4pr87qNU1CbzOlZa3jySxQvxxXR8cjifX+Or03rMY0DeJmN
zYInZLahyXBjsulyIYF+AN0OoQV+AFHgoNYnIJxiHPzRZcxAaNjscftLogyWRzmE
iw7ueBsPDt289IHAgdBIJwLgOFZf2223IOHcTHPccApVGI1J69ZS1S3XOpC8QYOo
3vXXTAUCgYEA8ttKOQUWXMn94wavPWNOcUe5QTEEDeJwvxq9362hI1z7p8ZStfzI
63FY7yem/9ajQItIgICBYkXRzDes4RTdk6w5+ANFiK9Ds1xZXIAT1yPw3uZJBqKD
NqcwahOQd0c83e9kI0jhIjXTnGa0DD7KJNoalqv1y651mjv1IXAZOQcCgYEA8eeM
lM59fGXBo6NiHBuvBZ7If3+PxDO5u5t0hzISH8AU8bMEhFsRlPdh0VwDZr+5fpof
GtytoMhxuvk1QW+1vvyGhhNXFg36xZixwRafEI+hv+mC3RGNh+7jR+g99KsaugUA
6KZpfVmcfYycKKiCLJ9syJDI4/+B0bK4J9gnTK8CgYAU37Zcekx2w0HYPp3XV+7J
G9IXgWAI1Xq9Yk4JqMHd6UMUI56+V7DpU7/CJpVbDhbQGGit6t20Fa43sF1ip0l4
ROhiod1bJz1ZcEmaAsQxzLwKXJ7QPC2tB+fIZlAXgH8B0G65/aykJR5AJi+5kbgM
PNbmNneU/zTKgfbK3fi9BwKBgCoTMzGCxPLJJCgZN+xZqFSa7Ja4kkH3GTwXaupE
/EAHgd0UXRnEWUeGy73FelX5zQLHPdfHQG/xzU5PIEM0cfE5LRDO9lvArLiHuYsz
KxGPWfvuWrOm5O4az+9m5rfStwBZ9HGC2GBUINL5jQPJY3Lte9daz4ZQn7zgkAVm
JFfDAoGACSAnQ3h5wU37/X4ytFQVnGnHyDgS/dmhK8Nhy3+Lp4GoRnYXzsFD2Wf9
au92m/mxfD1PdcY6NoqFqzen6RzYgoeCmAlQdirr1FrFgOwQP+UCzlwOrhMqRgUw
tbRykVYkhc/K41LLIUD/EggLklreO4QgOsRK/5RhxKM/BrKmltc=
-----END RSA PRIVATE KEY-----

// scripts\00-local-back-dev.sh

#!/usr/bin/env bash
set -euo pipefail

echo "[00-local-back-dev] start"
cd aws/back

echo "[00-local-back-dev] build dev image"
docker build -t aws-back:dev --target dev .

echo "[00-local-back-dev] run dev container"
docker run --rm -p 3000:3000 --name aws-back \
  -e PORT=3000 \
  -e NODE_ENV=development \
  -e CORS_ORIGIN=http://localhost:5173 \
  -e DATABASE_URL="mysql://root@host.docker.internal:3306/app_db" \
  aws-back:dev

// scripts\10-front-build.sh

cat > scripts/10-front-build.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "[front-build] start"

echo "[front-build] cd aws/front/web"
cd aws/front/web

echo "[front-build] node=$(node -v 2>/dev/null || echo 'no-node') npm=$(npm -v 2>/dev/null || echo 'no-npm')"

echo "[front-build] install deps"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "[front-build] build"
npm run build

echo "[front-build] dist summary"
ls -la dist | head -n 20
ls -la dist/assets | head -n 20

echo "[front-build] done"
EOF

chmod +x scripts/10-front-build.sh

// scripts\11-front-deploy-s3.sh

#!/usr/bin/env bash
set -euo pipefail

echo "[front-deploy] start"

AWS_PROFILE="${AWS_PROFILE:-terraform}"
AWS_REGION="${AWS_REGION:-us-east-1}"
S3_BUCKET="${S3_BUCKET:-awsok-fullstack-web-bucket-6c5dfc13}"
CF_DOMAIN="${CF_DOMAIN:-d2hiu34pyeqif1.cloudfront.net}"

echo "[front-deploy] AWS_PROFILE=$AWS_PROFILE AWS_REGION=$AWS_REGION"
echo "[front-deploy] S3_BUCKET=$S3_BUCKET CF_DOMAIN=$CF_DOMAIN"

export AWS_PROFILE AWS_REGION S3_BUCKET CF_DOMAIN

echo "[front-deploy] cd aws/front/web"
cd aws/front/web

echo "[front-deploy] dist exists?"
ls -la dist | head -n 20

echo "[front-deploy] sync -> s3://$S3_BUCKET"
aws s3 sync dist "s3://$S3_BUCKET" --delete

echo "[front-deploy] resolve CF_DIST_ID"
CF_DIST_ID=$(
  aws cloudfront list-distributions \
    --query "DistributionList.Items[?DomainName=='$CF_DOMAIN'].Id | [0]" \
    --output text
)
echo "[front-deploy] CF_DIST_ID=$CF_DIST_ID"

echo "[front-deploy] invalidate"
aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*"

echo "[front-deploy] done"

// scripts\20-ec2-back-run.sh

#!/usr/bin/env bash
set -euo pipefail

echo "[20-ec2-back-run] start"

# Assumes you're already on EC2 with repo available (git clone) OR you copied aws/back folder.
# Also assumes docker is installed (Terraform user_data does it).

cd aws/back

echo "[20-ec2-back-run] build prod image"
docker build -t aws-back:prod --target runtime .

echo "[20-ec2-back-run] ensure env file exists at /opt/aws-back/.env"
if [[ ! -f /opt/aws-back/.env ]]; then
  echo "[20-ec2-back-run] missing /opt/aws-back/.env"
  exit 1
fi

echo "[20-ec2-back-run] stop old container if exists"
docker rm -f aws-back >/dev/null 2>&1 || true

echo "[20-ec2-back-run] run prod container"
docker run -d --name aws-back --restart unless-stopped \
  --env-file /opt/aws-back/.env \
  -p 3000:3000 \
  aws-back:prod

echo "[20-ec2-back-run] logs tail"
docker logs -n 120 aws-back || true

// scripts\30-prisma-migrate-ec2.sh

#!/usr/bin/env bash
set -euo pipefail

echo "[30-prisma-migrate-ec2] start"
echo "[30-prisma-migrate-ec2] running migrate deploy inside container"

docker exec -it aws-back sh -lc "npx prisma migrate deploy"

echo "[30-prisma-migrate-ec2] done"

// aws\front\web\package.json

{
  "name": "web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@tanstack/react-query": "^5.90.12",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.562.0",
    "next-themes": "^0.4.6",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.69.0",
    "react-router-dom": "^7.11.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.4.0",
    "tw-animate-css": "^1.4.0",
    "zod": "^4.2.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@tailwindcss/vite": "^4.1.18",
    "@types/node": "^24.10.1",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.23",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.46.4",
    "vite": "^7.2.4",
    "vite-tsconfig-paths": "^6.0.3"
  }
}

// aws\front\web\vite.config.ts

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths()],
})

// aws\front\web\tsconfig.json

{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

// aws\front\web\tailwind.config.js

export default {
    darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}

// aws\front\web\index.html

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>web</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

// aws\front\web\.env.example

# Local dev (Vite)
VITE_API_BASE_URL=http://localhost:3000

// aws\front\web\.env

VITE_API_BASE_URL=http://localhost:3000

// aws\front\web\src\main.tsx

import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app/App"
import "./index.css"

console.log("[main] boot")

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// aws\back\tsconfig.json

{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "noFallthroughCasesInSwitch": false
  }
}

// aws\back\prisma.config.ts

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});

// aws\back\package.json

{
  "name": "back",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.2",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/swagger": "^11.2.3",
    "@prisma/adapter-mariadb": "^7.2.0",
    "@prisma/client": "^7.2.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.3",
    "mariadb": "^3.4.5",
    "prisma": "^7.2.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.18.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^22.10.7",
    "@types/supertest": "^6.0.2",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^16.0.0",
    "jest": "^30.0.0",
    "prettier": "^3.4.2",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.20.0"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
aws\back\Dockerfile
# ---------- base ----------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ---------- deps (para cachear npm ci) ----------
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ---------- dev (Windows/local) ----------
FROM deps AS dev
ENV NODE_ENV=development

COPY . .

# Prisma v7: necesitamos DATABASE_URL para que prisma.config.ts pueda resolver env("DATABASE_URL")
# (en dev lo vas a pasar por -e, esto es solo un fallback para build)
ENV DATABASE_URL="mysql://root:root@host.docker.internal:3306/app_db"

RUN echo "[dev] prisma generate..." \
 && npx prisma generate --schema prisma/schema.prisma \
 && echo "[dev] prisma generate OK" \
 && ls -la node_modules/.prisma/client | head -n 40

EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ---------- build (compilar Nest) ----------
FROM deps AS build
COPY . .

ENV DATABASE_URL="mysql://root:root@localhost:3306/app_db"
RUN echo "[build] prisma generate..." \
 && npx prisma generate --schema prisma/schema.prisma \
 && echo "[build] prisma generate OK" \
 && ls -la node_modules/.prisma/client | head -n 40

RUN npm run build

# ---------- prod (EC2) ----------
FROM base AS prod
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

# IMPORTANT: llevar Prisma Client generado al runtime
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client

RUN echo "[prod] prisma artifacts present?" \
 && ls -la node_modules/.prisma/client | head -n 40

EXPOSE 3000
CMD ["node", "dist/src/main.js"]

// aws\back\.env.example

# Common
PORT=3000

# Local
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=mysql://root@host.docker.internal:3306/app_db

# Prod (example)
# NODE_ENV=production
# CORS_ORIGIN=https://<cloudfront-domain>
# DATABASE_URL=mysql://<user>:<pass>@<rds-endpoint>:3306/app_db

// aws\back\.env

NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=mysql://root@localhost:3306/app_db

// aws\back\src\swagger.ts

import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('AWS Fullstack CRUD API')
  .setDescription('NestJS + Prisma + MySQL | ECS/Fargate-ready')
  .setVersion('1.0.0')
  .addTag('health')
  .addTag('products')
  .addTag('orders')
  .build();

// aws\back\src\main.ts

//aws\back\src\main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { swaggerConfig } from './swagger';

async function bootstrap() {
  console.log('[bootstrap] start');

  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  const port = Number(process.env.PORT || 3000);
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

  console.log('[bootstrap] env', {
    port,
    corsOrigin,
    nodeEnv: process.env.NODE_ENV,
  });

  app.enableCors({
    origin: corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, doc);

  await app.listen(port, '0.0.0.0');
  console.log(`[bootstrap] listening http://0.0.0.0:${port}`);
  console.log(`[bootstrap] swagger    http://0.0.0.0:${port}/docs`);
}

bootstrap().catch((err) => {
  console.log('[bootstrap] fatal', err);
  process.exit(1);
});

// aws\back\src\app.module.ts

//aws\back\src\app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath opcional: si existe lo toma, si no, igual lee process.env
      envFilePath: process.env.NODE_ENV === 'development' ? '.env' : undefined,
    }),
    PrismaModule,
    HealthModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {
  constructor() {
    console.log('[AppModule] init');
  }
}

// aws\back\prisma\schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["queryCompiler", "driverAdapters"]
}

datasource db {
  provider = "mysql"
  
}

model Product {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(120)
  price     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orderItems OrderItem[]
}

model Order {
  id        String      @id @default(cuid())
  total     Decimal     @db.Decimal(10, 2)
  createdAt DateTime    @default(now())
  items     OrderItem[]
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  unitPrice Decimal @db.Decimal(10, 2)
  lineTotal Decimal @db.Decimal(10, 2)

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@index([productId])
}

// aws\back\src\prisma\prisma.module.ts

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {
  constructor() {
    console.log('[PrismaModule] init');
  }
}

// aws\back\src\prisma\prisma.service.ts

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = process.env.DATABASE_URL;

    console.log('[PrismaService] ctor');
    console.log('[PrismaService] DATABASE_URL raw=', JSON.stringify(url));

    if (!url) {
      console.log('[PrismaService] missing DATABASE_URL');
      throw new Error('DATABASE_URL is required');
    }

    const adapter: PrismaMariaDb = new PrismaMariaDb(url);

    super({
      adapter,
      log: ['error', 'warn'],
    });

    console.log('[PrismaService] ctor ok');
  }

  async onModuleInit() {
    console.log('[PrismaService] connect start');
    await this.$connect();
    console.log('[PrismaService] connect ok');
  }

  async onModuleDestroy() {
    console.log('[PrismaService] disconnect start');
    await this.$disconnect();
    console.log('[PrismaService] disconnect ok');
  }
}



// aws\back\src\main.ts

//aws\back\src\main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { swaggerConfig } from './swagger';

async function bootstrap() {
  console.log('[bootstrap] start');

  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  const port = Number(process.env.PORT || 3000);
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

  console.log('[bootstrap] env', {
    port,
    corsOrigin,
    nodeEnv: process.env.NODE_ENV,
  });

  app.enableCors({
    origin: corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, doc);

  await app.listen(port, '0.0.0.0');
  console.log(`[bootstrap] listening http://0.0.0.0:${port}`);
  console.log(`[bootstrap] swagger    http://0.0.0.0:${port}/docs`);
}

bootstrap().catch((err) => {
  console.log('[bootstrap] fatal', err);
  process.exit(1);
});

// aws\back\src\app.module.ts

//aws\back\src\app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath opcional: si existe lo toma, si no, igual lee process.env
      envFilePath: process.env.NODE_ENV === 'development' ? '.env' : undefined,
    }),
    PrismaModule,
    HealthModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {
  constructor() {
    console.log('[AppModule] init');
  }
}

// aws\back\prisma\schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["queryCompiler", "driverAdapters"]
}

datasource db {
  provider = "mysql"
  
}

model Product {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(120)
  price     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orderItems OrderItem[]
}

model Order {
  id        String      @id @default(cuid())
  total     Decimal     @db.Decimal(10, 2)
  createdAt DateTime    @default(now())
  items     OrderItem[]
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  unitPrice Decimal @db.Decimal(10, 2)
  lineTotal Decimal @db.Decimal(10, 2)

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@index([productId])
}

// aws\back\src\prisma\prisma.module.ts

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {
  constructor() {
    console.log('[PrismaModule] init');
  }
}

// aws\back\src\prisma\prisma.service.ts

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = process.env.DATABASE_URL;

    console.log('[PrismaService] ctor');
    console.log('[PrismaService] DATABASE_URL raw=', JSON.stringify(url));

    if (!url) {
      console.log('[PrismaService] missing DATABASE_URL');
      throw new Error('DATABASE_URL is required');
    }

    const adapter: PrismaMariaDb = new PrismaMariaDb(url);

    super({
      adapter,
      log: ['error', 'warn'],
    });

    console.log('[PrismaService] ctor ok');
  }

  async onModuleInit() {
    console.log('[PrismaService] connect start');
    await this.$connect();
    console.log('[PrismaService] connect ok');
  }

  async onModuleDestroy() {
    console.log('[PrismaService] disconnect start');
    await this.$disconnect();
    console.log('[PrismaService] disconnect ok');
  }
}