import { describe, expect, it } from "vitest";
import { demoAxelarSnapshots, demoEvents } from "./fixtures";
import { reconcileOperation } from "./reconcile";
import { reduceOperation } from "./reducer";

function operation(id: string) {
  return reduceOperation(demoEvents.filter(event => event.operationId === id));
}

describe("Axelar reconciliation", () => {
  it("reconciles when HCS-derived state and Axelar evidence agree", () => {
    const result = reconcileOperation(operation("demo-complete"), demoAxelarSnapshots["demo-complete"]);

    expect(result.outcome).toBe("reconciled");
  });

  it("keeps pending Axelar delivery in flight", () => {
    const result = reconcileOperation(operation("demo-in-flight"), demoAxelarSnapshots["demo-in-flight"]);

    expect(result.outcome).toBe("in_flight");
  });

  it("surfaces destination transaction disagreement", () => {
    const result = reconcileOperation(
      operation("demo-discrepancy"),
      demoAxelarSnapshots["demo-discrepancy"],
    );

    expect(result.outcome).toBe("discrepancy");
    expect(result.reason).toMatch(/Destination transaction hash differs/);
  });

  it("does not treat unknown external state as success", () => {
    const op = operation("demo-in-flight");
    const result = reconcileOperation(op, {
      provider: "axelar",
      sourceTxHash: op.sourceTxHash,
      status: "unknown",
      observedAt: new Date(0).toISOString(),
    });

    expect(result.outcome).toBe("unavailable");
  });
});
