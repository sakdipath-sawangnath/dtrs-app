import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { isSentryDebugPageEnabled } from "@/lib/sentryEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  if (!isSentryDebugPageEnabled()) {
    return new Response("Not Found", { status: 404 });
  }

  const secret = process.env.NEXTAUTH_SECRET ?? authOptions.secret;
  const jwt = await getToken({
    req,
    secret: secret as string,
  });
  if (!jwt) {
    return new Response("Unauthorized", { status: 401 });
  }

  throw new Error("GlitchTip server test");
}
