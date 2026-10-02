import { NextResponse } from "next/server";
import { getAxelarSnapshot } from "@/lib/ops/axelar";
import { reconcileOperation } from "@/lib/ops/reconcile";
import { getOperation } from "@/lib/ops/read-model";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ operationId: string }> },
) {
  const { operationId } = await params;
  const operation = await getOperation(operationId);

  if (!operation) {
    return NextResponse.json({ error: "operation not found" }, { status: 404 });
  }

  try {
    const snapshot = await getAxelarSnapshot(operation);
    return NextResponse.json({
      operation,
      external: snapshot,
      reconciliation: reconcileOperation(operation, snapshot),
    });
  } catch (error) {
    return NextResponse.json(
      {
        operation,
        reconciliation: {
          operationId,
          outcome: "unavailable",
          ledgerStatus: operation.status,
          externalStatus: "unavailable",
          reason: error instanceof Error ? error.message : "External evidence unavailable",
        },
      },
      { status: 200 },
    );
  }
}
