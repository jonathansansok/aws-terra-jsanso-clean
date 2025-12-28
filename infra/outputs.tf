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
