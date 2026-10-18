import type { Metadata } from "next";
import { InviteApp } from "@/engine/runtime/InviteApp";
import { corinaInvite } from "@/invites/seed";

export const metadata: Metadata = {
  title: "Corina’s Big Adventure · youin",
  description: "A little explorer. A curious cat. And a very big surprise…",
  openGraph: {
    title: "Corina’s Big Adventure",
    description: "A little explorer. A curious cat. And a very big surprise…",
    images: ["/themes/dinosaur/jungle.webp"],
  },
};

export default function Page() {
  return (
    <>
      <link rel="preload" as="image" href="/themes/dinosaur/jungle.webp" fetchPriority="high" />
      <link rel="preload" as="image" href="/invites/corina/stickers/corina.webp" />
      <InviteApp invite={corinaInvite} />
    </>
  );
}
