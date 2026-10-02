import { describe, expect, it } from "vitest";
import { demoEvents } from "./fixtures";
import { reduceOperation, reduceOperations } from "./reducer";

describe("operation reducer", () => {
  it("replays a complete operation deterministically", () => {
    const events = demoEvents.filter(event => event.operationId === "demo-complete");
    const first = reduceOperation(events);
    const second = reduceOperation([...events].reverse());

    expect(first).toEqual(second);
    expect(first.status).toBe("reconciled");
    expect(first.destinationTxHash).toBe(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    expect(first.lastSequence).toBe(4);
  });

  it("builds independent read models for all operation IDs", () => {
    const operations = reduceOperations(demoEvents);

    expect(operations).toHaveLength(3);
    expect(operations.map(operation => operation.operationId).sort()).toEqual([
      "demo-complete",
      "demo-discrepancy",
      "demo-in-flight",
    ]);
  });

  it("rejects duplicate HCS sequence numbers", () => {
    const events = demoEvents
      .filter(event => event.operationId === "demo-complete")
      .map(event => ({ ...event }));

    events[1].sequence = events[0].sequence;

    expect(() => reduceOperation(events)).toThrow(/Duplicate HCS sequence/);
  });

  it("rejects a stream that does not begin with operation.initiated", () => {
    const events = demoEvents
      .filter(event => event.operationId === "demo-complete" && event.type !== "operation.initiated");

    expect(() => reduceOperation(events)).toThrow(/must be operation.initiated/);
  });
});
