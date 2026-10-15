from urllib.parse import parse_qs, urlsplit

import pytest
from moto import mock_aws
from s3_helper import S3Helper, create_bucket

BUCKET = "demo-bucket"

@pytest.fixture(autouse=True)
def fake_aws(monkeypatch):
    # Fake credentials so a broken test can never reach a real AWS account.
    for var in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN"):
        monkeypatch.setenv(var, "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.delenv("AWS_PROFILE", raising=False)

@mock_aws
def test_upload_and_list_paginates():
    create_bucket(BUCKET)
    h = S3Helper(BUCKET)
    for i in range(5):
        h.upload(f"docs/{i}.txt", b"x", content_type="text/plain")
    # page_size=2 forces three pages, so the paginator must follow tokens.
    assert h.list_keys("docs/", page_size=2) == [f"docs/{i}.txt" for i in range(5)]
    assert h.s3.head_object(Bucket=BUCKET, Key="docs/0.txt")["ContentType"] == "text/plain"

@mock_aws
def test_presigned_url_has_expiry():
    create_bucket(BUCKET)
    url = S3Helper(BUCKET).presigned_url("docs/0.txt", expires=300)
    assert url.startswith(f"https://{BUCKET}.s3")
    # The URL is only valid inside moto's mock, so we check its query parameters rather than fetching it.
    query = parse_qs(urlsplit(url).query)
    assert query["X-Amz-Expires"] == ["300"]
    assert query["X-Amz-Algorithm"] == ["AWS4-HMAC-SHA256"]

@mock_aws
def test_delete_prefix_only_touches_matching_keys():
    create_bucket(BUCKET)
    h = S3Helper(BUCKET)
    for key in ["logs/a.txt", "logs/b.txt", "keep/c.txt"]:
        h.upload(key, b"x")
    assert h.delete_prefix("logs/") == 2
    assert h.list_keys() == ["keep/c.txt"]

@mock_aws
def test_delete_empty_prefix_is_noop():
    # delete_objects with an empty Objects list raises MalformedXML, so the helper must skip the call.
    create_bucket(BUCKET)
    assert S3Helper(BUCKET).delete_prefix("nothing/") == 0
