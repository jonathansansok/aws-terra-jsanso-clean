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
