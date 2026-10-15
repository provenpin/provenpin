import boto3
from botocore.config import Config

# SigV4 is required for X-Amz-Expires in presigned URLs. The default signer for S3 is SigV2 in some setups.
SIGV4 = Config(signature_version="s3v4")

class S3Helper:
    def __init__(self, bucket: str, region: str = "us-east-1"):
        self.bucket = bucket
        self.s3 = boto3.client("s3", region_name=region, config=SIGV4)

    def upload(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
        self.s3.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType=content_type)

    def list_keys(self, prefix: str = "", page_size: int = 1000) -> list[str]:
        # list_objects_v2 returns at most 1000 keys per page; the paginator follows continuation tokens.
        pages = self.s3.get_paginator("list_objects_v2").paginate(
            Bucket=self.bucket, Prefix=prefix, PaginationConfig={"PageSize": page_size}
        )
        return [obj["Key"] for page in pages for obj in page.get("Contents", [])]

    def presigned_url(self, key: str, expires: int = 300) -> str:
        # Signing is local, so no network call is made.
        return self.s3.generate_presigned_url(
            "get_object", Params={"Bucket": self.bucket, "Key": key}, ExpiresIn=expires
        )

    def delete_prefix(self, prefix: str) -> int:
        keys = self.list_keys(prefix)
        # delete_objects rejects an empty Objects list and accepts at most 1000 keys per call.
        for i in range(0, len(keys), 1000):
            batch = [{"Key": k} for k in keys[i:i + 1000]]
            self.s3.delete_objects(Bucket=self.bucket, Delete={"Objects": batch, "Quiet": True})
        return len(keys)


def create_bucket(bucket: str, region: str = "us-east-1") -> None:
    s3 = boto3.client("s3", region_name=region)
    # us-east-1 rejects a LocationConstraint; every other region requires one.
    if region == "us-east-1":
        s3.create_bucket(Bucket=bucket)
    else:
        s3.create_bucket(Bucket=bucket, CreateBucketConfiguration={"LocationConstraint": region})
