import fs from "node:fs/promises";
import path from "node:path";
import type { CrossChainOperation } from "./types";

export type ReadModelSnapshot = {
  schemaVersion: 1;
  generatedAt: string;
  source: "fixtures" | "hedera-mirror-node";
  topicId?: string;
  operations: CrossChainOperation[];
};

export function defaultStatePath(): string {
  return path.resolve(process.cwd(), "../../.crosschain-ops/state.json");
}

export async function writeReadModel(
  snapshot: ReadModelSnapshot,
  filePath = defaultStatePath(),
): Promise<string> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  return filePath;
}

export async function readReadModel(
  filePath = defaultStatePath(),
): Promise<ReadModelSnapshot> {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text) as ReadModelSnapshot;
}

export function canonicalOperations(operations: CrossChainOperation[]): string {
  return JSON.stringify(
    [...operations]
      .sort((a, b) => a.operationId.localeCompare(b.operationId))
      .map(operation => ({
        ...operation,
        events: [...operation.events].sort((a, b) => a.sequence - b.sequence),
      })),
  );
}
