import Link from "next/link";
import { notFound } from "next/navigation";
import { getAxelarSnapshot } from "@/lib/ops/axelar";
import { reconcileOperation } from "@/lib/ops/reconcile";
import { getOperation } from "@/lib/ops/read-model";

export const dynamic = "force-dynamic";

export default async function OperationPage({
  params,
}: {
  params: Promise<{ operationId: string }>;
}) {
  const { operationId } = await params;
  const operation = await getOperation(operationId);

  if (!operation) {
    notFound();
  }

  let reconciliation;
  try {
    const snapshot = await getAxelarSnapshot(operation);
    reconciliation = reconcileOperation(operation, snapshot);
  } catch (error) {
    reconciliation = {
      operationId,
      outcome: "unavailable" as const,
      ledgerStatus: operation.status,
      externalStatus: "unavailable",
      reason: error instanceof Error ? error.message : "External evidence unavailable",
    };
  }

  return (
    <section>
      <Link className="muted" href="/operations">
        ← All operations
      </Link>
      <div className="eyebrow section">Operation detail</div>
      <h1>{operation.operationId}</h1>

      {operation.demo ? (
        <div className="banner">
          Demo fixture. The lifecycle shape is real; the IDs on this page are deliberately synthetic.
        </div>
      ) : null}

      <div className="factGrid">
        <div className="fact">
          <strong>Ledger status</strong>
          <span className={"badge " + operation.status}>{operation.status}</span>
        </div>
        <div className="fact">
          <strong>Reconciliation</strong>
          <span className={"badge " + reconciliation.outcome}>{reconciliation.outcome}</span>
          <div className="muted">{reconciliation.reason}</div>
        </div>
        <div className="fact">
          <strong>Route</strong>
          <div>{operation.sourceChain} → {operation.destinationChain}</div>
        </div>
        <div className="fact">
          <strong>HCS topic</strong>
          <div className="code">{operation.topicId}</div>
        </div>
        <div className="fact">
          <strong>Source transaction</strong>
          <div className="code">{operation.sourceTxHash}</div>
        </div>
        <div className="fact">
          <strong>Destination transaction</strong>
          <div className="code">{operation.destinationTxHash ?? "not recorded yet"}</div>
        </div>
      </div>

      <section className="section">
        <div className="eyebrow">Immutable lifecycle</div>
        <h2>Ordered HCS events</h2>
        <ol className="timeline">
          {operation.events.map(event => (
            <li key={event.sequence}>
              <strong>{event.type}</strong>
              <div className="muted">sequence {event.sequence} · consensus {event.consensusTimestamp}</div>
              {event.externalStatus ? <div>External status: {event.externalStatus}</div> : null}
              {event.messageId ? <div className="code">Message: {event.messageId}</div> : null}
              {event.destinationTxHash ? <div className="code">Destination: {event.destinationTxHash}</div> : null}
              {event.note ? <div>{event.note}</div> : null}
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
