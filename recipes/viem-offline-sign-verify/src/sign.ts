import { privateKeyToAccount } from "viem/accounts";
import {
  decodeFunctionData,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  parseUnits,
  recoverTypedDataAddress,
  verifyMessage,
  type Address,
  type Hex,
} from "viem";

export const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;

export const account = privateKeyToAccount(TEST_PRIVATE_KEY);

export async function signAndVerifyMessage(
  message: string,
): Promise<{ signature: Hex; valid: boolean }> {
  const signature = await account.signMessage({ message });
  const valid = await verifyMessage({
    address: account.address,
    message,
    signature,
  });
  return { signature, valid };
}

export type TransferIntent = {
  token: Address;
  to: Address;
  value: bigint;
  nonce: bigint;
};

export async function signTypedDataAndRecover(
  intent: TransferIntent,
): Promise<{ signature: Hex; recovered: Address }> {
  const typedData = {
    domain: {
      name: "ProvenPinToken",
      version: "1",
      chainId: 1,
      verifyingContract: intent.token,
    },
    types: {
      Transfer: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    },
    primaryType: "Transfer",
    message: {
      to: intent.to,
      value: intent.value,
      nonce: intent.nonce,
    },
  } as const;

  const signature = await account.signTypedData(typedData);
  const recovered = await recoverTypedDataAddress({ ...typedData, signature });
  return { signature, recovered };
}

export function encodeTransfer(to: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, amount],
  });
}

export function decodeTransfer(data: Hex): { to: Address; amount: bigint } {
  const decoded = decodeFunctionData({ abi: erc20Abi, data });
  if (decoded.functionName !== "transfer") {
    throw new Error(`unexpected function selector: ${decoded.functionName}`);
  }
  const [to, amount] = decoded.args as readonly [Address, bigint];
  return { to, amount };
}

export function toBaseUnits(amount: string, decimals = 18): bigint {
  return parseUnits(amount, decimals);
}

export function fromBaseUnits(amount: bigint, decimals = 18): string {
  return formatUnits(amount, decimals);
}
