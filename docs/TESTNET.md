# Testnet evidence runbook

This is the final submission proof workflow.

## 1. Create a dedicated HCS topic

~~~bash
export HEDERA_OPERATOR_ID=0.0.x
export HEDERA_OPERATOR_KEY=...
yarn ops:hcs:create-topic
~~~

Copy the printed topic ID.

## 2. Produce or select a real Axelar GMP operation

Use an existing Hedera -> EVM Axelar GMP test operation from your application or the Axelar Hedera workshop path.

Export the source transaction hash:

~~~bash
export SOURCE_TX_HASH=0x...
export DESTINATION_CHAIN=ethereum-sepolia
export OPERATION_ID=bounty-proof-1
export HEDERA_TOPIC_ID=0.0.x
~~~

## 3. Anchor the initiated operation on HCS

~~~bash
yarn ops:hcs:publish-demo
~~~

Capture:

- Hedera transaction ID
- HCS sequence number
- topic ID

## 4. Confirm through Mirror Node

~~~text
https://testnet.mirrornode.hedera.com/api/v1/topics/<TOPIC_ID>/messages/<SEQUENCE>
~~~

Decode the message and confirm the source transaction hash and operation ID.

## 5. Fill the public proof

Copy proofs/testnet-proof.example.json to proofs/testnet-proof.json and replace placeholders with real public values only.

Do not put a key, mnemonic, auth token, or wallet secret in proofs.

## 6. Verify

~~~bash
yarn ops:proof:verify
~~~

Commit proofs/testnet-proof.json only after it passes.
