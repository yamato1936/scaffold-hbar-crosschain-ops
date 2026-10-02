import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const proofSchema = z.object({
  network: z.literal("testnet"),
  hcsTopicId: z.string().regex(/^0\.0\.\d+$/),
  hcsSequenceNumber: z.number().int().positive(),
  hederaTransactionId: z.string().min(3),
  mirrorNodeUrl: z.string().url(),
  hashScanUrl: z.string().url(),
  axelarSourceTransactionHash: z.string().min(3),
  axelarExplorerUrl: z.string().url().optional(),
  destinationTransactionHash: z.string().min(3).optional(),
});

async function main() {
  const proofPath = path.resolve(process.cwd(), "../../proofs/testnet-proof.json");
  const text = await fs.readFile(proofPath, "utf8");
  const proof = proofSchema.parse(JSON.parse(text));

  const response = await fetch(proof.mirrorNodeUrl, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Mirror Node proof URL returned HTTP " + response.status);
  }

  const body = (await response.json()) as {
    sequence_number?: number;
    topic_id?: string;
  };

  if (body.sequence_number !== proof.hcsSequenceNumber) {
    throw new Error(
      "Mirror Node sequence mismatch: expected " +
        proof.hcsSequenceNumber +
        ", got " +
        String(body.sequence_number),
    );
  }

  if (body.topic_id !== proof.hcsTopicId) {
    throw new Error(
      "Mirror Node topic mismatch: expected " +
        proof.hcsTopicId +
        ", got " +
        String(body.topic_id),
    );
  }

  console.log("Public Hedera testnet proof verified");
  console.log("Topic:", proof.hcsTopicId);
  console.log("Sequence:", proof.hcsSequenceNumber);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
