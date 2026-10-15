import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand, paginateListObjectsV2, NoSuchKey } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function createS3(region = "us-east-1") {
  // Static fake credentials keep presigning and tests fully offline; real code would use the default chain.
  return new S3Client({ region, credentials: { accessKeyId: "AKIDEXAMPLE", secretAccessKey: "secret" } });
}

export class Storage {
  constructor(private s3: S3Client, private bucket: string) {}

  async putJson(key: string, value: unknown) {
    const res = await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket, Key: key, Body: JSON.stringify(value), ContentType: "application/json", ServerSideEncryption: "AES256",
    }));
    return res.ETag;
  }

  /** Returns null for a missing key instead of throwing. */
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      return JSON.parse(await res.Body!.transformToString()) as T;
    } catch (e) {
      if (e instanceof NoSuchKey) return null;
      throw e;
    }
  }

  /** Walks every page of ListObjectsV2 with the built-in paginator. */
  async listKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    for await (const page of paginateListObjectsV2({ client: this.s3, pageSize: 2 }, { Bucket: this.bucket, Prefix: prefix })) {
      for (const o of page.Contents ?? []) keys.push(o.Key!);
    }
    return keys;
  }

  /** Deletes in chunks of 1000, the DeleteObjects limit, and returns any per-key errors. */
  async deleteKeys(keys: string[]) {
    const errors: string[] = [];
    for (let i = 0; i < keys.length; i += 1000) {
      const res = await this.s3.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })) } }));
      for (const e of res.Errors ?? []) errors.push(`${e.Key}: ${e.Code}`);
    }
    return errors;
  }

  /** Presigned GET URL, signed locally with no network call. */
  downloadUrl(key: string, expiresIn = 300) {
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn });
  }
}
