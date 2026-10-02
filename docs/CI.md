# Quality gate

Every template change must pass the same credential-free checks used by the Hedera Harness baseline:

```bash
yarn install
yarn lint
yarn next:check-types
yarn test
yarn next:build
```

The gate intentionally requires no Hedera operator credentials and no Axelar API credentials.
