import type { Metadata } from "next";
import { InviteApp } from "@/engine/runtime/InviteApp";
import { getInvite } from "@/invites/store";
import { InviteRecovery } from "@/app/i/[slug]/recovery";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const invite = await getInvite(slug);
  if (!invite) return { title: "Invite not found · youin" };
  return {
    title: `${invite.childName}’s Big Adventure · youin`,
    description: `A jungle invitation for ${invite.childName}, turning ${invite.age}.`,
  };
}

export default async function InvitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const invite = await getInvite(slug);
  if (!invite) return <InviteRecovery slug={slug} />;
  return <InviteApp invite={invite} />;
}
