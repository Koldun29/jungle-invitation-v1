import type { Metadata } from "next";
import { CreateForm } from "@/app/create/create-form";

export const metadata: Metadata = {
  title: "Create an invite · youin",
  description: "Pick a theme, add the photos and the party details, and get a link.",
};

export default function CreatePage() {
  return (
    <main className="studio">
      <p className="dossier-kicker">youin.lol</p>
      <h1>Make a jungle invite</h1>
      <p>This is the host flow in miniature: theme, photos, party details, then a link. The photo job runs before the URL comes back.</p>
      <CreateForm />
    </main>
  );
}
