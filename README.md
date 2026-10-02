# Scaffold-HBAR Cross-Chain Ops

**Send across chains. Know exactly what happened.**

A production-oriented Scaffold-HBAR starter for **tracking, replaying, and reconciling Axelar-powered Hedera cross-chain operations**.

Most bridge starters answer: **How do I send a cross-chain message?**

Cross-Chain Ops answers the next operational questions:

- Where is this operation now?
- Did Axelar observe it?
- Did the destination execution actually happen?
- Which destination transaction corresponds to the Hedera source transaction?
- Is the local read model consistent with independent external evidence?
- Can the operational database be rebuilt from an immutable ledger after data loss?

The reusable pattern is:

~~~text
Hedera source transaction
        |
        v
     Axelar GMP
        |
        v
destination execution
        |
        +----------------------+
        |                      |
        v                      v
 Axelar status API        HCS event topic
                               |
                               v
                          Mirror Node
                               |
                               v
                        deterministic reducer
                               |
                               v
                         queryable read model
                               |
                               v
                         reconciliation
~~~

## Why this exists

Cross-chain applications combine multiple asynchronous systems. A source transaction can succeed while a relay is still pending, underfunded, delayed, or failed on the destination. A UI toast is not an operational record.

This template uses:

- **Axelar GMP** as the cross-chain transport and independent delivery evidence.
- **Hedera Consensus Service (HCS)** as the immutable ordered operation ledger.
- **Hedera Mirror Node** as the public read path for HCS events.
- A deterministic reducer as the rebuildable read-model layer.
- A reconciliation adapter that compares ledger-derived state with Axelar evidence.

Remove Axelar and the cross-chain use case disappears. Remove HCS and replayable operational history disappears.

## Scaffold it

~~~bash
npm create scaffold-hbar@latest -- --template yamato1936/scaffold-hbar-crosschain-ops
cd scaffold-hbar-crosschain-ops
yarn install
yarn next:dev
~~~

Open http://localhost:3000.

No wallet, private key, API key, or .env file is required for the first journey.

## Credential-free judge path

1. Open /operations.
2. Open demo-complete.
3. Inspect the ordered HCS-shaped lifecycle.
4. Open demo-discrepancy.
5. Confirm the disagreement is surfaced instead of hidden.
6. Call /api/reconcile/demo-complete and inspect the machine-readable reconciliation result.

The bundled fixtures exercise the same parser and reducer used by live mirror-node events.

## Operation lifecycle

The v1 schema intentionally stays small:

~~~text
operation.initiated
      |
      v
axelar.observed
      |
      v
destination.executed
      |
      +-------> operation.reconciled
      |
      +-------> operation.discrepancy
~~~

Each HCS payload contains business identifiers and cross-chain evidence. Consensus sequence number and timestamp come from Mirror Node rather than being trusted from the payload itself.

## Commands

~~~bash
yarn lint
yarn next:check-types
yarn test
yarn next:build
yarn check

yarn ops:replay
yarn ops:verify-state
yarn ops:hcs:create-topic
yarn ops:hcs:publish-demo
yarn ops:axelar:observe
yarn ops:proof:verify
~~~

## Live Hedera testnet mode

Keep secrets in your local shell:

~~~bash
export HEDERA_OPERATOR_ID=0.0.x
export HEDERA_OPERATOR_KEY=your-private-key
~~~

Create a dedicated HCS topic:

~~~bash
yarn ops:hcs:create-topic
~~~

The command prints a topic ID. Export it:

~~~bash
export HEDERA_TOPIC_ID=0.0.x
~~~

Publish a real operation event:

~~~bash
export SOURCE_TX_HASH=0x...
export DESTINATION_CHAIN=ethereum-sepolia
yarn ops:hcs:publish-demo
~~~

Start the app with HEDERA_TOPIC_ID present. The server reads the event stream from Hedera Mirror Node and derives the operations view.

Rebuild a local read-model snapshot from the same stream:

~~~bash
yarn ops:replay
yarn ops:verify-state
~~~

After the corresponding Axelar GMP operation is visible publicly, anchor the external observation back into the HCS lifecycle:

~~~bash
export OPERATION_ID=bounty-proof-1
export SOURCE_TX_HASH=0x...
yarn ops:axelar:observe
~~~

The observation command is conservative: it writes an Axelar observation first, and writes destination-executed/reconciled events only when Axelar exposes destination execution evidence.

The operator key is used only by CLI write scripts. Browser routes never receive it.

## Live Axelar reconciliation

For non-demo operations, the server queries the public Axelarscan GMP status endpoint using the Hedera source transaction hash. The adapter is deliberately isolated in packages/nextjs/lib/ops/axelar.ts so teams can swap in AxelarJS SDK or an internal observability service.

The reconciliation policy is conservative:

- External pending state -> operation remains in flight.
- Both sides agree on successful execution -> reconciled.
- Destination transaction hashes disagree -> discrepancy.
- The ledger claims reconciled while Axelar does not report execution -> discrepancy.
- Uncertain or unavailable external evidence is never converted into success.

## Event sourcing, not HCS-as-a-database

HCS stores the durable ordered facts. Application query state is derived.

That distinction matters because operational queries such as "show stuck operations" or "find failures in the last hour" should not scan an entire HCS topic on every page load. The included demo read model is intentionally dependency-light for the bounty gate; the reducer boundary is designed so production users can persist its output in SQLite, Postgres, ClickHouse, or their existing data platform without changing the event contract.

A production deployment normally runs a cursor-based indexer:

~~~text
Mirror Node pagination
 -> sequence cursor
 -> decode + validate
 -> idempotent apply
 -> database upsert
 -> API/query layer
~~~

See docs/ARCHITECTURE.md for the production extension path.

## Public proof

A final bounty submission should commit public verification metadata in proofs/testnet-proof.json:

- HCS topic ID
- HCS sequence number
- Hedera transaction ID
- Mirror Node URL
- HashScan URL
- Axelar source transaction hash
- Axelar explorer URL
- destination transaction hash when available

No secret belongs in the proof file.

Until a real proof is generated, the repository contains only proofs/testnet-proof.example.json and the UI clearly labels bundled records as demo fixtures.

## Testing strategy

Tests focus on failure modes that are expensive in real cross-chain systems:

- deterministic replay
- duplicate sequence rejection
- conflicting destination hashes
- status normalization
- successful reconciliation
- pending delivery
- external/ledger disagreement

The CI gate performs install, lint, type-check, tests, and production build.

## Adapt this template

The transport-facing code is narrow on purpose. Common extensions include:

- Persisting reducer output in Postgres.
- Polling multiple HCS topics.
- Supporting Axelar ITS transfers in addition to GMP calls.
- Adding an operations webhook when a status changes.
- Alerting on operations that remain in flight past an SLA.
- Adding provider adapters for LayerZero or CCIP while preserving the same HCS event contract.
- Correlating application business IDs such as settlementId, orderId, or payrollRunId.

## Security notes

- Never expose HEDERA_OPERATOR_KEY through NEXT_PUBLIC variables.
- Treat Axelar status as external evidence, not authority to rewrite HCS history.
- Validate every HCS payload before applying it.
- Enforce monotonic sequence processing in a persistent indexer.
- Keep source/destination chain allowlists in the application that initiates GMP.
- This repository is a starter, not an audited bridge or custody system.

## Bounty readiness

The repository includes:

- MIT License
- template.json
- README.md
- AGENTS.md
- credential-free first journey
- deterministic unit tests
- GitHub Actions quality gate
- Hedera Harness spec and validators
- scripts for real HCS testnet evidence
- public proof schema

The remaining submission-time step is to run the live testnet script with a locally held funded account and commit only the resulting public proof metadata.

## License

MIT
