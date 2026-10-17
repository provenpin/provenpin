import forge from "node-forge";

export type Certificate = ReturnType<typeof forge.pki.createCertificate>;

export interface GeneratedCertificate {
  privateKeyPem: string;
  publicKeyPem: string;
  certPem: string;
  certificate: Certificate;
}

export function generateSelfSignedCertificate(
  commonName: string,
  altNames: string[],
  days = 365,
): GeneratedCertificate {
  const keys = forge.pki.rsa.generateKeyPair(2048);

  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";

  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + days);

  const attributes = [
    { name: "commonName", value: commonName },
    { name: "organizationName", value: "ProvenPin" },
    { shortName: "C", value: "US" },
  ];

  cert.setSubject(attributes);
  cert.setIssuer(attributes);

  cert.setExtensions([
    { name: "basicConstraints", cA: false },
    { name: "keyUsage", digitalSignature: true, keyEncipherment: true },
    {
      name: "subjectAltName",
      altNames: altNames.map((value) => ({ type: 2, value })),
    },
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
    publicKeyPem: forge.pki.publicKeyToPem(keys.publicKey),
    certPem: forge.pki.certificateToPem(cert),
    certificate: cert,
  };
}

export function parseCertificate(pem: string): Certificate {
  return forge.pki.certificateFromPem(pem);
}

export function verifyCertificate(certificate: Certificate): boolean {
  return certificate.verify(certificate);
}

export function signData(privateKeyPem: string, data: string): string {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const digest = forge.md.sha256.create();
  digest.update(data, "utf8");
  return privateKey.sign(digest);
}

export function verifyData(
  publicKeyPem: string,
  data: string,
  signature: string,
): boolean {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const digest = forge.md.sha256.create();
  digest.update(data, "utf8");
  return publicKey.verify(digest.digest().bytes(), signature);
}
