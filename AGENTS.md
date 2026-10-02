# AGENTS.md

This repository is a Scaffold-HBAR template for operating Axelar-powered cross-chain applications.

## Product invariant

The template is not a bridge UI. It is the operations layer after a cross-chain call is initiated:

Hedera source transaction -> Axelar GMP -> destination execution -> HCS event log -> mirror node -> derived read model -> reconciliation.

Axelar and HCS are both load-bearing. Do not replace either with a decorative badge or static text.

## Architecture invariants

- HCS is the immutable ordered operation history, not a query database.
- The operations list and detail views are derived read models.
- A read model must be reproducible from the ordered HCS event stream.
- Axelar status is independent external evidence used for reconciliation.
- A mismatch between ledger state and external evidence must be surfaced, never silently overwritten.
- The first journey must work with no wallet and no .env file.
- Live writes are server-side or CLI-only. Never expose a Hedera operator private key to the browser.
- Public mirror-node reads may be used without credentials.
- Fixtures must be deterministic and visibly labeled as demo data.
- Never commit .env, private keys, mnemonics, bearer tokens, or funded wallet material.

## Event model

Operation payloads are validated by packages/nextjs/lib/ops/schema.ts.

Supported event types:

- operation.initiated
- axelar.observed
- destination.executed
- operation.reconciled
- operation.discrepancy

Changing an event field is a schema change. Update fixtures, reducer tests, documentation, and Harness assertions together.

## Quality gate

Before committing:

~~~bash
yarn install
yarn lint
yarn next:check-types
yarn test
yarn next:build
~~~

The app must boot and these routes must render without credentials:

- /
- /operations
- /operations/demo-complete
- /operations/demo-discrepancy
- /api/operations
- /api/operations/demo-complete
- /api/reconcile/demo-complete

## Live testnet

Use @hiero-ledger/sdk, never the retired @hashgraph/sdk package.

Credentials are read from:

- HEDERA_OPERATOR_ID
- HEDERA_OPERATOR_KEY
- HEDERA_TOPIC_ID

Axelar live reconciliation uses the public Axelarscan GMP endpoint and the source transaction hash.

## Scope discipline

Prefer a narrow, trustworthy operations primitive over adding unrelated token, NFT, DeFi, oracle, or AI features. The reusable pattern is tracking + replay + reconciliation.
