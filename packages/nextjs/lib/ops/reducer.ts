import type { CrossChainOperation, OperationEvent, OperationStatus } from "./types";

function required(value: string | undefined, field: string, event: OperationEvent): string {
  if (!value) {
    throw new Error("Missing " + field + " on " + event.type + " at sequence " + event.sequence);
  }
  return value;
}

function assertSame(existing: string | undefined, incoming: string | undefined, label: string): void {
  if (existing && incoming && existing.toLowerCase() !== incoming.toLowerCase()) {
    throw new Error("Conflicting " + label + ": " + existing + " != " + incoming);
  }
}

export function reduceOperation(events: OperationEvent[]): CrossChainOperation {
  if (events.length === 0) {
    throw new Error("Cannot reduce an empty operation event stream");
  }

  const ordered = [...events].sort((a, b) => a.sequence - b.sequence);
  const seen = new Set<number>();
  for (const event of ordered) {
    if (seen.has(event.sequence)) {
      throw new Error("Duplicate HCS sequence " + event.sequence);
    }
    seen.add(event.sequence);
  }

  const first = ordered[0];
  if (first.type !== "operation.initiated") {
    throw new Error("First operation event must be operation.initiated");
  }

  const operationId = first.operationId;
  const sourceChain = required(first.sourceChain, "sourceChain", first);
  const destinationChain = required(first.destinationChain, "destinationChain", first);
  const sourceTxHash = required(first.sourceTxHash, "sourceTxHash", first);

  let status: OperationStatus = "initiated";
  let messageId: string | undefined;
  let destinationTxHash: string | undefined;
  let externalStatus: string | undefined;
  let discrepancy: string | undefined;

  for (const event of ordered) {
    if (event.operationId !== operationId) {
      throw new Error("Mixed operation IDs in one event stream");
    }

    assertSame(sourceTxHash, event.sourceTxHash, "source transaction hash");
    assertSame(destinationChain, event.destinationChain, "destination chain");

    switch (event.type) {
      case "operation.initiated":
        break;
      case "axelar.observed":
        messageId = event.messageId ?? messageId;
        externalStatus = event.externalStatus ?? externalStatus;
        status = "in_flight";
        break;
      case "destination.executed":
        assertSame(destinationTxHash, event.destinationTxHash, "destination transaction hash");
        destinationTxHash = required(event.destinationTxHash, "destinationTxHash", event);
        externalStatus = event.externalStatus ?? externalStatus;
        status = "executed";
        break;
      case "operation.reconciled":
        assertSame(destinationTxHash, event.destinationTxHash, "destination transaction hash");
        destinationTxHash = event.destinationTxHash ?? destinationTxHash;
        externalStatus = event.externalStatus ?? externalStatus;
        status = "reconciled";
        discrepancy = undefined;
        break;
      case "operation.discrepancy":
        status = "discrepancy";
        discrepancy = event.note ?? "Ledger and external evidence disagree";
        externalStatus = event.externalStatus ?? externalStatus;
        break;
    }
  }

  const last = ordered[ordered.length - 1];

  return {
    operationId,
    provider: "axelar",
    sourceChain,
    destinationChain,
    sourceTxHash,
    messageId,
    destinationTxHash,
    externalStatus,
    status,
    discrepancy,
    lastSequence: last.sequence,
    lastUpdatedAt: last.consensusTimestamp,
    topicId: last.topicId,
    demo: ordered.some(event => event.demo === true),
    events: ordered,
  };
}

export function reduceOperations(events: OperationEvent[]): CrossChainOperation[] {
  const grouped = new Map<string, OperationEvent[]>();
  for (const event of events) {
    const current = grouped.get(event.operationId) ?? [];
    current.push(event);
    grouped.set(event.operationId, current);
  }

  return [...grouped.values()]
    .map(reduceOperation)
    .sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt));
}
