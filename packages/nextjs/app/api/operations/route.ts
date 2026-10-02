import { NextResponse } from "next/server";
import { getOperations } from "@/lib/ops/read-model";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    operations: await getOperations(),
  });
}
