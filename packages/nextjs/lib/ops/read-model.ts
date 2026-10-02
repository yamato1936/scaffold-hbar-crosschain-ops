import { demoEvents } from "./fixtures";
import { fetchTopicEvents } from "./mirror";
import { reduceOperations } from "./reducer";
import type { CrossChainOperation, OperationEvent } from "./types";

async function loadEvents(): Promise<OperationEvent[]> {
  const topicId = process.env.HEDERA_TOPIC_ID;
  if (!topicId) {
    return demoEvents;
  }
  return fetchTopicEvents(topicId);
}

export async function getOperations(): Promise<CrossChainOperation[]> {
  return reduceOperations(await loadEvents());
}

export async function getOperation(operationId: string): Promise<CrossChainOperation | undefined> {
  const operations = await getOperations();
  return operations.find(operation => operation.operationId === operationId);
}
