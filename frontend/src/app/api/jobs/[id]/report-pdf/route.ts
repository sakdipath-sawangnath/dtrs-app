import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerApiBaseUrl } from "@/lib/serverApiBase";

function extractBearerToken(request: NextRequest, jwtToken: string | undefined): string {
  const headerAuth = request.headers.get("authorization");
  const bearerFromHeader =
    headerAuth?.startsWith("Bearer ") ? headerAuth.slice(7).trim() : "";
  return bearerFromHeader || (jwtToken ?? "");
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const secret = process.env.NEXTAUTH_SECRET ?? authOptions.secret;
  const jwt = await getToken({
    req: request,
    secret: secret as string,
  });
  const token = extractBearerToken(
    request,
    (jwt?.accessToken as string | undefined) ?? undefined,
  );

  if (!token) {
    return Response.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
      },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const apiBase = getServerApiBaseUrl();
  const upstreamUrl = `${apiBase}/jobs/${encodeURIComponent(id)}/report-pdf`;

  const res = await fetch(upstreamUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const message = (await res.text()) || res.statusText || "ไม่สามารถดาวน์โหลด PDF ได้";
    return Response.json(
      {
        success: false,
        error: {
          code: "UPSTREAM_ERROR",
          message,
        },
      },
      { status: res.status },
    );
  }

  const pdf = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "application/pdf";
  const disposition =
    res.headers.get("content-disposition") ||
    `attachment; filename="report-${id}.pdf"`;

  return new Response(pdf, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
