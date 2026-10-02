import { z } from "zod";
import { operationEventTypes, type OperationEventPayload } from "./types";

export const operationEventPayloadSchema = z.object({
  schemaVersion: z.literal(1),
  operationId: z.string().min(1).max(128),
  type: z.enum(operationEventTypes),
  provider: z.literal("axelar"),
  sourceChain: z.string().min(1).max(128).optional(),
  destinationChain: z.string().min(1).max(128).optional(),
  sourceTxHash: z.string().min(3).max(256).optional(),
  messageId: z.string().min(1).max(512).optional(),
  destinationTxHash: z.string().min(3).max(256).optional(),
  externalStatus: z.string().min(1).max(128).optional(),
  note: z.string().max(500).optional(),
  demo: z.boolean().optional(),
});

export function parseOperationEventPayload(value: unknown): OperationEventPayload {
  return operationEventPayloadSchema.parse(value);
}
