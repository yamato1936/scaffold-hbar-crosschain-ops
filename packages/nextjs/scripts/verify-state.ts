import {
  canonicalOperations,
  readReadModel,
} from "../lib/ops/file-store";
import { reduceOperations } from "../lib/ops/reducer";
import { loadOperationEvents } from "../lib/ops/source";

async function main() {
  const persisted = await readReadModel();
  const fresh = reduceOperations(await loadOperationEvents());

  const expected = canonicalOperations(persisted.operations);
  const actual = canonicalOperations(fresh);

  if (expected !== actual) {
    throw new Error(
      "Read-model verification failed: persisted state differs from a fresh HCS replay",
    );
  }

  console.log("Read-model verification passed");
  console.log("Operations:", fresh.length);
  console.log("Last source:", persisted.source);
  if (persisted.topicId) {
    console.log("Topic:", persisted.topicId);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
