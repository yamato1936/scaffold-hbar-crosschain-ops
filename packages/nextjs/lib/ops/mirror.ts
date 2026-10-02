import { parseOperationEventPayload } from "./schema";
import type { OperationEvent } from "./types";

type MirrorMessage = {
  consensus_timestamp: string;
  message: string;
  sequence_number: number;
  topic_id: string;
};

type MirrorResponse = {
  messages?: MirrorMessage[];
  links?: {
    next?: string | null;
  };
};

function mirrorBaseUrl(): string {
  return (process.env.HEDERA_MIRROR_NODE_URL || "https://testnet.mirrornode.hedera.com").replace(/\/$/, "");
}

function decodeMessage(message: MirrorMessage): OperationEvent {
  const raw = Buffer.from(message.message, "base64").toString("utf8");
  const payload = parseOperationEventPayload(JSON.parse(raw));

  return {
    ...payload,
    sequence: message.sequence_number,
    consensusTimestamp: message.consensus_timestamp,
    topicId: message.topic_id,
  };
}

export async function fetchTopicEvents(topicId: string): Promise<OperationEvent[]> {
  const base = mirrorBaseUrl();
  let url: string | null =
    base + "/api/v1/topics/" + encodeURIComponent(topicId) + "/messages?limit=100&order=asc";
  const events: OperationEvent[] = [];
  let pages = 0;

  while (url && pages < 50) {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Mirror Node returned HTTP " + response.status);
    }

    const body = (await response.json()) as MirrorResponse;
    for (const message of body.messages ?? []) {
      events.push(decodeMessage(message));
    }

    const next = body.links?.next;
    url = next ? (next.startsWith("http") ? next : base + next) : null;
    pages += 1;
  }

  return events;
}
