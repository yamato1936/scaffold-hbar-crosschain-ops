# Architecture

## Boundary

Cross-Chain Ops starts after an application has decided to initiate an Axelar operation. It does not replace Axelar Gateway contracts and it does not mint or custody bridged assets.

Its responsibility is operational truth:

1. Record durable lifecycle facts on HCS.
2. Rebuild current operation state from ordered facts.
3. Compare that state with independent Axelar evidence.
4. Surface disagreements.

## Event sourcing

The HCS payload excludes consensus metadata because the sender must not self-assert ordering or consensus time.

Mirror Node enriches each decoded payload with:

- sequence_number
- consensus_timestamp
- topic_id

The reducer consumes those enriched events in ascending sequence order.

## Production indexer

The starter keeps the credential-free path dependency-light. A production deployment should persist the reducer output.

Recommended loop:

1. Read the last persisted sequence cursor.
2. GET Mirror Node messages where sequence number is greater than the cursor.
3. Decode base64 payload.
4. Validate with the Zod schema.
5. Reject duplicate or non-monotonic sequence numbers.
6. Apply the event to the operation reducer.
7. Persist the operation row and cursor atomically.
8. Repeat.

Suggested operation indexes:

- operation_id unique
- status
- destination_chain
- source_tx_hash unique where appropriate
- last_updated_at

## Reconciliation

Reconciliation never mutates history. A reconciliation outcome can be written back as a new HCS event.

The live adapter reads Axelarscan GMP status using the source transaction hash. Teams that need stronger availability guarantees can implement the same AxelarStatusProvider interface with the AxelarJS SDK or an internal service.

## Failure model

The design distinguishes:

- in-flight: no contradiction, delivery is incomplete
- reconciled: ledger and external evidence agree
- discrepancy: evidence conflicts
- unavailable: external evidence could not be obtained

Unavailable is not success.

## Provider expansion

Do not put provider-specific fields throughout the app. Add an adapter that returns the normalized external snapshot:

- provider
- status
- sourceTxHash
- destinationTxHash
- messageId

The HCS event contract can then remain stable across provider additions.
