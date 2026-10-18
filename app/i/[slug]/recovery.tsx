"use client";

import { useEffect, useState } from "react";
import { InviteApp } from "@/engine/runtime/InviteApp";
import { inviteSchema, type Invite } from "@/invites/schema";

export function InviteRecovery({ slug }: { slug: string }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`youin-invite:${slug}`);
      if (!raw) {
        setMissing(true);
        return;
      }
      const parsed = inviteSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        setMissing(true);
        return;
      }
      setInvite(parsed.data);
    } catch {
      setMissing(true);
    }
  }, [slug]);

  if (invite) return <InviteApp invite={invite} />;
  if (!missing) return <p className="studio-status">Opening the invite…</p>;
  return (
    <main className="studio">
      <h1>That invite is not on this server</h1>
      <p>If you just created it, open the link in the same browser. Connect Upstash or Neon so every visitor can load it.</p>
      <a href="/create">Create an invite</a>
    </main>
  );
}
