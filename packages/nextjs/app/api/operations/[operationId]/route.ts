import { NextResponse } from "next/server";
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

  return NextResponse.json({ operation });
}
