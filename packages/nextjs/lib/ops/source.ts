import { demoEvents } from "./fixtures";
import { fetchTopicEvents } from "./mirror";
import type { OperationEvent } from "./types";

export async function loadOperationEvents(): Promise<OperationEvent[]> {
  const topicId = process.env.HEDERA_TOPIC_ID;
  if (!topicId) {
    return demoEvents;
  }
  return fetchTopicEvents(topicId);
}
