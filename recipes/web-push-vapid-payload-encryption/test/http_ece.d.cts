// http_ece 1.2.1 ships no types and there is no @types/http_ece. This declares only the
// decrypt() call the test makes, as ece.js parseParams() reads it: binary values are
// Buffers or base64url strings, and the receiver's key is a node:crypto ECDH object.
// http_ece is CommonJS, so this is a .d.cts: `export =` is only valid in a CommonJS-format declaration file.
declare module "http_ece" {
  import type { ECDH } from "node:crypto";
  namespace ece {
    interface DecryptParams {
      version?: "aes128gcm" | "aesgcm";
      privateKey?: ECDH;
      authSecret?: Buffer | string;
      key?: Buffer | string;
      dh?: Buffer | string;
      salt?: Buffer | string;
      rs?: number | string;
    }
    function decrypt(buffer: Buffer, params: DecryptParams): Buffer;
  }
  export = ece;
}
