import Link from "next/link";
import { getOperations } from "@/lib/ops/read-model";

export const dynamic = "force-dynamic";

function readableTimestamp(value: string): string {
  if (/^\d+\.\d+$/.test(value)) {
    return value;
  }
  return new Date(value).toISOString();
}

export default async function OperationsPage() {
  const operations = await getOperations();
  const demo = operations.every(operation => operation.demo);

  return (
    <section>
      <div className="eyebrow">Operations ledger</div>
      <h1>Cross-chain operations</h1>
      <p className="lede">
        Queryable state derived from an ordered HCS event stream, then reconciled against Axelar evidence.
      </p>

      {demo ? (
        <div className="banner">
          Credential-free demo mode. These records are deterministic fixtures, not claimed testnet transactions.
          Set HEDERA_TOPIC_ID to read a live HCS topic through Mirror Node.
        </div>
      ) : null}

      <div className="operationList">
        {operations.map(operation => (
          <Link className="operation" href={"/operations/" + operation.operationId} key={operation.operationId}>
            <div>
              <strong>{operation.operationId}</strong>
              <div className="muted code">{operation.sourceTxHash}</div>
            </div>
            <div>
              <strong>{operation.destinationChain}</strong>
              <div className="muted">via Axelar</div>
            </div>
            <div>
              <span className={"badge " + operation.status}>{operation.status}</span>
            </div>
            <div className="muted">{readableTimestamp(operation.lastUpdatedAt)}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
