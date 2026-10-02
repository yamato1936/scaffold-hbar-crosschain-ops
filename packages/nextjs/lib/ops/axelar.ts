import { demoAxelarSnapshots } from "./fixtures";
import type { AxelarSnapshot, CrossChainOperation } from "./types";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return undefined;
}

function stringAt(root: unknown, paths: string[][]): string | undefined {
  for (const path of paths) {
    let current: unknown = root;
    for (const key of path) {
      const record = asRecord(current);
      current = record?.[key];
    }
    if (typeof current === "string" && current.length > 0) {
      return current;
    }
  }
  return undefined;
}

export async function fetchLiveAxelarSnapshot(sourceTxHash: string): Promise<AxelarSnapshot> {
  const base = process.env.AXELAR_GMP_API_URL || "https://api.axelarscan.io/gmp/searchGMP";
  const separator = base.includes("?") ? "&" : "?";
  const url = base + separator + "txHash=" + encodeURIComponent(sourceTxHash);

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Axelar GMP API returned HTTP " + response.status);
  }

  const body = (await response.json()) as unknown;
  const bodyRecord = asRecord(body);
  const data = Array.isArray(bodyRecord?.data) ? bodyRecord?.data : [];
  const item = data[0];

  if (!item) {
    throw new Error("Axelar GMP API returned no operation for the source transaction");
  }

  return {
    provider: "axelar",
    sourceTxHash,
    status: stringAt(item, [["status"]]) || "unknown",
    simplifiedStatus: stringAt(item, [["simplified_status"], ["simplifiedStatus"]]),
    messageId: stringAt(item, [["call", "id"], ["message_id"], ["messageId"]]),
    destinationTxHash: stringAt(item, [
      ["executed", "transaction", "hash"],
      ["execute", "transaction", "hash"],
      ["executed", "transactionHash"],
      ["destination_transaction", "hash"],
      ["destinationTransaction", "hash"],
    ]),
    observedAt: new Date().toISOString(),
    raw: item,
  };
}

export async function getAxelarSnapshot(operation: CrossChainOperation): Promise<AxelarSnapshot> {
  if (operation.demo) {
    const fixture = demoAxelarSnapshots[operation.operationId];
    if (!fixture) {
      throw new Error("Missing demo Axelar snapshot for " + operation.operationId);
    }
    return fixture;
  }

  return fetchLiveAxelarSnapshot(operation.sourceTxHash);
}
