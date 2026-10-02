import type { AxelarSnapshot, CrossChainOperation, ReconciliationResult } from "./types";

function normalized(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function externalExecuted(snapshot: AxelarSnapshot): boolean {
  const status = normalized(snapshot.simplifiedStatus || snapshot.status);
  return ["executed", "received", "success", "succeeded", "completed"].includes(status);
}

function externalPending(snapshot: AxelarSnapshot): boolean {
  const status = normalized(snapshot.simplifiedStatus || snapshot.status);
  return ["called", "confirming", "pending", "processing", "approved", "executing"].includes(status);
}

export function reconcileOperation(
  operation: CrossChainOperation,
  snapshot: AxelarSnapshot,
): ReconciliationResult {
  if (snapshot.sourceTxHash.toLowerCase() !== operation.sourceTxHash.toLowerCase()) {
    return {
      operationId: operation.operationId,
      outcome: "discrepancy",
      ledgerStatus: operation.status,
      externalStatus: snapshot.simplifiedStatus || snapshot.status,
      reason: "Axelar evidence belongs to a different source transaction",
    };
  }

  if (operation.destinationTxHash && snapshot.destinationTxHash) {
    if (operation.destinationTxHash.toLowerCase() !== snapshot.destinationTxHash.toLowerCase()) {
      return {
        operationId: operation.operationId,
        outcome: "discrepancy",
        ledgerStatus: operation.status,
        externalStatus: snapshot.simplifiedStatus || snapshot.status,
        destinationTxHash: snapshot.destinationTxHash,
        reason: "Destination transaction hash differs between HCS-derived state and Axelar evidence",
      };
    }
  }

  if (externalExecuted(snapshot)) {
    if (!operation.destinationTxHash && !snapshot.destinationTxHash) {
      return {
        operationId: operation.operationId,
        outcome: "unavailable",
        ledgerStatus: operation.status,
        externalStatus: snapshot.simplifiedStatus || snapshot.status,
        reason: "Axelar reports execution but no destination transaction hash is available yet",
      };
    }

    return {
      operationId: operation.operationId,
      outcome: "reconciled",
      ledgerStatus: operation.status,
      externalStatus: snapshot.simplifiedStatus || snapshot.status,
      destinationTxHash: snapshot.destinationTxHash ?? operation.destinationTxHash,
      reason: "HCS-derived operation state agrees with Axelar execution evidence",
    };
  }

  if (operation.status === "reconciled" && !externalExecuted(snapshot)) {
    return {
      operationId: operation.operationId,
      outcome: "discrepancy",
      ledgerStatus: operation.status,
      externalStatus: snapshot.simplifiedStatus || snapshot.status,
      reason: "HCS history claims reconciliation but Axelar does not report successful execution",
    };
  }

  if (externalPending(snapshot)) {
    return {
      operationId: operation.operationId,
      outcome: "in_flight",
      ledgerStatus: operation.status,
      externalStatus: snapshot.simplifiedStatus || snapshot.status,
      reason: "No contradiction detected; Axelar still reports an in-flight operation",
    };
  }

  return {
    operationId: operation.operationId,
    outcome: "unavailable",
    ledgerStatus: operation.status,
    externalStatus: snapshot.simplifiedStatus || snapshot.status || "unknown",
    reason: "External status is not sufficient to prove success or a contradiction",
  };
}
