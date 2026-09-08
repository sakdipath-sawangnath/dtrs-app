import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import PublicLayoutShell from "@/components/PublicLayoutShell";
import { authOptions } from "@/lib/auth";
import { isSentryDebugPageEnabled } from "@/lib/sentryEnv";
import GlitchTipDebugClient from "./GlitchTipDebugClient";

export default async function GlitchTipDebugPage() {
  if (!isSentryDebugPageEnabled()) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login?callbackUrl=/debug/glitchtip");
  }

  return (
    <PublicLayoutShell subtitle="ทดสอบ GlitchTip">
      <GlitchTipDebugClient />
    </PublicLayoutShell>
  );
}
