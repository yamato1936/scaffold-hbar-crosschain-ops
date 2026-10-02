import { reduceOperations } from "./reducer";
import { loadOperationEvents } from "./source";
import type { CrossChainOperation } from "./types";

export async function getOperations(): Promise<CrossChainOperation[]> {
  return reduceOperations(await loadOperationEvents());
}

export async function getOperation(operationId: string): Promise<CrossChainOperation | undefined> {
  const operations = await getOperations();
  return operations.find(operation => operation.operationId === operationId);
}
