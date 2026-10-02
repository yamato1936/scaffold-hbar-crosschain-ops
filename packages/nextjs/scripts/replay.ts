import { reduceOperations } from "../lib/ops/reducer";
import { loadOperationEvents } from "../lib/ops/source";
import { writeReadModel } from "../lib/ops/file-store";

async function main() {
  const events = await loadOperationEvents();
  const operations = reduceOperations(events);
  const source = process.env.HEDERA_TOPIC_ID ? "hedera-mirror-node" : "fixtures";

  const output = await writeReadModel({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source,
    topicId: process.env.HEDERA_TOPIC_ID,
    operations,
  });

  console.log("Cross-Chain Ops replay complete");
  console.log("Source:", source);
  console.log("Events:", events.length);
  console.log("Operations:", operations.length);
  console.log("Read model:", output);

  for (const operation of operations) {
    console.log(
      operation.operationId.padEnd(24),
      operation.status.padEnd(12),
      operation.destinationChain,
    );
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
