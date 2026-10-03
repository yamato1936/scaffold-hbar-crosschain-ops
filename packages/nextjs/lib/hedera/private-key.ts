import { PrivateKey } from "@hiero-ledger/sdk";

export function parseOperatorPrivateKey(value: string): PrivateKey {
  const normalized = value.trim();
  const raw = normalized.startsWith("0x") ? normalized.slice(2) : normalized;
  const keyType = (process.env.HEDERA_KEY_TYPE || "").trim().toUpperCase();

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    if (keyType === "ECDSA") {
      return PrivateKey.fromStringECDSA(raw);
    }
    if (keyType === "ED25519") {
      return PrivateKey.fromStringED25519(raw);
    }

    throw new Error(
      "Raw HEX private keys are ambiguous. Set HEDERA_KEY_TYPE=ECDSA or ED25519, " +
        "or use the DER Encoded Private Key from Hedera Portal.",
    );
  }

  try {
    return PrivateKey.fromStringDer(normalized);
  } catch {
    throw new Error(
      "Could not parse HEDERA_OPERATOR_KEY. Use a DER Encoded Private Key, or set " +
        "HEDERA_KEY_TYPE=ECDSA|ED25519 when using the raw HEX key.",
    );
  }
}
