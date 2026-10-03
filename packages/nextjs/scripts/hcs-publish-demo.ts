import {
  Client,
  TopicId,
  TopicMessageSubmitTransaction,
} from "@hiero-ledger/sdk";
import { parseOperatorPrivateKey } from "../lib/hedera/private-key";
import { operationEventPayloadSchema } from "../lib/ops/schema";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(name + " is required");
  }
  return value;
}

async function main() {
  const operatorId = required("HEDERA_OPERATOR_ID");
  const operatorKey = parseOperatorPrivateKey(required("HEDERA_OPERATOR_KEY"));
  const topicId = TopicId.fromString(required("HEDERA_TOPIC_ID"));
  const sourceTxHash = required("SOURCE_TX_HASH");
  const sourceChain = process.env.SOURCE_CHAIN || "avalanche-fuji";
  const destinationChain = process.env.DESTINATION_CHAIN || "hedera-testnet";

  const payload = operationEventPayloadSchema.parse({
    schemaVersion: 1,
    operationId: process.env.OPERATION_ID || "live-" + Date.now(),
    type: "operation.initiated",
    provider: "axelar",
    sourceChain,
    destinationChain,
    sourceTxHash,
  });

  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  try {
    const transaction = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(payload))
      .execute(client);

    const receipt = await transaction.getReceipt(client);
    const record = await transaction.getRecord(client);
    const transactionId = transaction.transactionId?.toString();

    console.log("HCS event published");
    console.log("Status:", receipt.status.toString());
    console.log("Topic ID:", topicId.toString());
    console.log("Sequence:", record.receipt.topicSequenceNumber?.toString() || "unknown");
    console.log("Transaction ID:", transactionId || "unknown");

    if (transactionId) {
      console.log(
        "HashScan:",
        "https://hashscan.io/testnet/transaction/" + encodeURIComponent(transactionId),
      );
    }
  } finally {
    client.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
