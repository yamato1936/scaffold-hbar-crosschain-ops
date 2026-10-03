import {
  Client,
  TopicCreateTransaction,
} from "@hiero-ledger/sdk";
import { parseOperatorPrivateKey } from "../lib/hedera/private-key";

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
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  try {
    const transaction = await new TopicCreateTransaction()
      .setTopicMemo("scaffold-hbar-crosschain-ops")
      .setAdminKey(operatorKey.publicKey)
      .setSubmitKey(operatorKey.publicKey)
      .execute(client);

    const receipt = await transaction.getReceipt(client);
    const topicId = receipt.topicId?.toString();

    if (!topicId) {
      throw new Error("Hedera did not return a topic ID");
    }

    console.log("HCS topic created");
    console.log("Topic ID:", topicId);
    console.log(
      "Mirror Node:",
      "https://testnet.mirrornode.hedera.com/api/v1/topics/" + topicId + "/messages",
    );
    console.log(
      "HashScan:",
      "https://hashscan.io/testnet/topic/" + topicId,
    );
  } finally {
    client.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
