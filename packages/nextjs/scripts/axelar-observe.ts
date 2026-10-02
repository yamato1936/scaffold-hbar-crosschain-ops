import {
  Client,
  PrivateKey,
  TopicId,
  TopicMessageSubmitTransaction,
} from "@hiero-ledger/sdk";
import { fetchLiveAxelarSnapshot } from "../lib/ops/axelar";
import { operationEventPayloadSchema } from "../lib/ops/schema";
import type { OperationEventPayload } from "../lib/ops/types";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(name + " is required");
  }
  return value;
}

async function submit(
  client: Client,
  topicId: TopicId,
  payload: OperationEventPayload,
): Promise<void> {
  const transaction = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(JSON.stringify(operationEventPayloadSchema.parse(payload)))
    .execute(client);

  const receipt = await transaction.getReceipt(client);
  console.log(payload.type, receipt.status.toString(), transaction.transactionId?.toString());
}

async function main() {
  const operatorId = required("HEDERA_OPERATOR_ID");
  const operatorKey = PrivateKey.fromString(required("HEDERA_OPERATOR_KEY"));
  const topicId = TopicId.fromString(required("HEDERA_TOPIC_ID"));
  const sourceTxHash = required("SOURCE_TX_HASH");
  const operationId = required("OPERATION_ID");

  const snapshot = await fetchLiveAxelarSnapshot(sourceTxHash);
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  try {
    await submit(client, topicId, {
      schemaVersion: 1,
      operationId,
      type: "axelar.observed",
      provider: "axelar",
      sourceTxHash,
      messageId: snapshot.messageId,
      externalStatus: snapshot.simplifiedStatus || snapshot.status,
    });

    if (snapshot.destinationTxHash) {
      await submit(client, topicId, {
        schemaVersion: 1,
        operationId,
        type: "destination.executed",
        provider: "axelar",
        sourceTxHash,
        destinationTxHash: snapshot.destinationTxHash,
        externalStatus: snapshot.simplifiedStatus || snapshot.status,
      });

      await submit(client, topicId, {
        schemaVersion: 1,
        operationId,
        type: "operation.reconciled",
        provider: "axelar",
        sourceTxHash,
        destinationTxHash: snapshot.destinationTxHash,
        externalStatus: snapshot.simplifiedStatus || snapshot.status,
        note: "Axelar delivery evidence observed and anchored by Cross-Chain Ops.",
      });
    } else {
      console.log("Axelar has not exposed a destination transaction yet; no success event was written.");
    }
  } finally {
    client.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
