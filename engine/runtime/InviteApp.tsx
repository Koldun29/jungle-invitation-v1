"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import type { Invite } from "@/invites/schema";
import { AudioProvider } from "@/engine/audio/AudioProvider";
import { InviteShell } from "@/engine/runtime/shell";
import { getTheme } from "@/themes/registry";

export function InviteApp({ invite }: { invite: Invite }) {
  const theme = getTheme(invite.themeId);
  const Experience = theme.Experience;

  useLayoutEffect(() => {
    gsap.set(".leaf.left", { xPercent: -105 });
    gsap.set(".leaf.right", { xPercent: 105 });
  }, []);

  return (
    <AudioProvider>
      <InviteShell invite={invite} theme={theme}>
        <Experience />
      </InviteShell>
    </AudioProvider>
  );
}
