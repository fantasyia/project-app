import { NextResponse } from "next/server";
import { improveFantasyiaFragment } from "@/lib/miniwordpress/fantasyia-semantic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = improveFantasyiaFragment({
      text: String(body?.text || ""),
      keyword: body?.keyword ? String(body.keyword) : "",
      siloName: body?.siloName ? String(body.siloName) : null,
      position: body?.position ? String(body.position) : "meio",
      mode: body?.mode ? String(body.mode) : "clareza",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nao foi possivel melhorar o trecho.",
      },
      { status: 400 }
    );
  }
}
