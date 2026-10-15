import {
  Interface,
  Wallet,
  formatUnits,
  parseUnits,
  verifyMessage,
  verifyTypedData,
  type TypedDataDomain,
  type TypedDataField,
} from "ethers";

export const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export const TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
];

export function createTestWallet(): Wallet {
  return new Wallet(TEST_PRIVATE_KEY);
}

export function createErc20Interface(): Interface {
  return new Interface(ERC20_ABI);
}

export const TYPED_DATA_DOMAIN: TypedDataDomain = {
  name: "ProvenPin",
  version: "1",
  chainId: 1,
  verifyingContract: "0x000000000000000000000000000000000000dEaD",
};

export const MAIL_TYPES: Record<string, TypedDataField[]> = {
  Mail: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "contents", type: "string" },
  ],
};

export type Mail = {
  from: string;
  to: string;
  contents: string;
};

export async function signMessage(wallet: Wallet, message: string): Promise<string> {
  return wallet.signMessage(message);
}

export function recoverMessageSigner(message: string, signature: string): string {
  return verifyMessage(message, signature);
}

export async function signMail(wallet: Wallet, mail: Mail): Promise<string> {
  return wallet.signTypedData(TYPED_DATA_DOMAIN, MAIL_TYPES, mail);
}

export function recoverMailSigner(mail: Mail, signature: string): string {
  return verifyTypedData(TYPED_DATA_DOMAIN, MAIL_TYPES, mail, signature);
}

export function encodeErc20Transfer(to: string, amount: bigint): string {
  return createErc20Interface().encodeFunctionData("transfer", [to, amount]);
}

export function decodeErc20Transfer(data: string): { to: string; amount: bigint } {
  const decoded = createErc20Interface().decodeFunctionData("transfer", data);
  return { to: decoded[0] as string, amount: decoded[1] as bigint };
}

export function parseErc20Transfer(data: string): {
  name: string;
  to: string;
  amount: bigint;
} {
  const parsed = createErc20Interface().parseTransaction({ data });
  if (!parsed) {
    throw new Error("calldata does not match the ERC-20 transfer selector");
  }
  return {
    name: parsed.name,
    to: parsed.args[0] as string,
    amount: parsed.args[1] as bigint,
  };
}

export function toBaseUnits(value: string, decimals = 18): bigint {
  return parseUnits(value, decimals);
}

export function fromBaseUnits(value: bigint, decimals = 18): string {
  return formatUnits(value, decimals);
}
