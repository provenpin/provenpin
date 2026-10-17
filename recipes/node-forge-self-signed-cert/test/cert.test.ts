import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateSelfSignedCertificate,
  parseCertificate,
  signData,
  verifyCertificate,
  verifyData,
} from "../src/cert.ts";

const fixture = generateSelfSignedCertificate("example.test", [
  "example.test",
  "www.example.test",
]);

test("generates a self-signed certificate with subject and issuer", () => {
  const { certificate } = fixture;
  assert.equal(certificate.subject.getField("CN")?.value, "example.test");
  assert.equal(certificate.issuer.getField("CN")?.value, "example.test");
  assert.equal(certificate.issuer.getField("O")?.value, "ProvenPin");
});

test("sets the requested validity window", () => {
  const { certificate } = fixture;
  const { notBefore, notAfter } = certificate.validity;
  assert.ok(notAfter.getTime() > notBefore.getTime());
  const days = (notAfter.getTime() - notBefore.getTime()) / 86_400_000;
  assert.ok(Math.abs(days - 365) < 1);
});

test("includes basicConstraints, keyUsage and subjectAltName extensions", () => {
  const { certificate } = fixture;
  const constraints = certificate.getExtension("basicConstraints");
  assert.equal(constraints.cA, false);
  const usage = certificate.getExtension("keyUsage");
  assert.equal(usage.digitalSignature, true);
  assert.equal(usage.keyEncipherment, true);
  const san = certificate.getExtension("subjectAltName");
  assert.deepEqual(
    san.altNames.map((entry: { value: string }) => entry.value),
    ["example.test", "www.example.test"],
  );
});

test("round-trips through PEM and verifies the certificate signature", () => {
  const parsed = parseCertificate(fixture.certPem);
  assert.equal(parsed.subject.getField("CN")?.value, "example.test");
  assert.equal(parsed.issuer.getField("CN")?.value, "example.test");
  assert.equal(verifyCertificate(parsed), true);
});

test("signs and verifies data with SHA-256", () => {
  const message = "provenpin";
  const signature = signData(fixture.privateKeyPem, message);
  assert.equal(typeof signature, "string");
  assert.equal(verifyData(fixture.publicKeyPem, message, signature), true);
});

test("rejects tampered data", () => {
  const signature = signData(fixture.privateKeyPem, "original");
  assert.equal(verifyData(fixture.publicKeyPem, "tampered", signature), false);
});
