export const operationEventTypes = [
  "operation.initiated",
  "axelar.observed",
  "destination.executed",
  "operation.reconciled",
  "operation.discrepancy",
] as const;

export type OperationEventType = (typeof operationEventTypes)[number];

export type OperationEventPayload = {
  schemaVersion: 1;
  operationId: string;
  type: OperationEventType;
  provider: "axelar";
  sourceChain?: string;
  destinationChain?: string;
  sourceTxHash?: string;
  messageId?: string;
  destinationTxHash?: string;
  externalStatus?: string;
  note?: string;
  demo?: boolean;
};

export type OperationEvent = OperationEventPayload & {
  sequence: number;
  consensusTimestamp: string;
  topicId: string;
};

export type OperationStatus = "initiated" | "in_flight" | "executed" | "reconciled" | "discrepancy";

export type CrossChainOperation = {
  operationId: string;
  provider: "axelar";
  sourceChain: string;
  destinationChain: string;
  sourceTxHash: string;
  messageId?: string;
  destinationTxHash?: string;
  externalStatus?: string;
  status: OperationStatus;
  discrepancy?: string;
  lastSequence: number;
  lastUpdatedAt: string;
  topicId: string;
  demo: boolean;
  events: OperationEvent[];
};

export type AxelarSnapshot = {
  provider: "axelar";
  sourceTxHash: string;
  status: string;
  simplifiedStatus?: string;
  messageId?: string;
  destinationTxHash?: string;
  observedAt: string;
  raw?: unknown;
};

export type ReconciliationResult = {
  operationId: string;
  outcome: "reconciled" | "in_flight" | "discrepancy" | "unavailable";
  ledgerStatus: OperationStatus;
  externalStatus: string;
  destinationTxHash?: string;
  reason: string;
};
