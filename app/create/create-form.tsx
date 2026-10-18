"use client";

import { useState, type FormEvent } from "react";

type Result = {
  url: string;
  host: string;
  storage: string;
  photoJob: { status: string; notes: string[] };
};

export function CreateForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setResult(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/invites", { method: "POST", body: data });
      const payload = (await response.json()) as Result & { ok?: boolean; error?: string; invite?: unknown };
      if (!response.ok || !payload.ok || !payload.url) {
        setError(payload.error || "The invite could not be created.");
        return;
      }
      if (payload.invite) {
        const slug = payload.url.split("/").pop();
        sessionStorage.setItem(`youin-invite:${slug}`, JSON.stringify(payload.invite));
      }
      setResult(payload);
    } catch {
      setError("The invite could not be created.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="studio-form" onSubmit={onSubmit}>
      <fieldset>
        <legend>Theme</legend>
        <label className="theme on">
          <input type="radio" name="themeId" value="dinosaur" defaultChecked />
          Dinosaur jungle
        </label>
        <label className="theme">
          <input type="radio" name="themeId" value="ocean" disabled />
          Ocean (soon)
        </label>
      </fieldset>
      <label>
        Child’s name
        <input name="childName" required maxLength={40} placeholder="Corina" />
      </label>
      <div className="split">
        <label>
          Age
          <input name="age" type="number" min={1} max={18} required defaultValue={7} />
        </label>
        <label>
          Pronoun
          <select name="childPronoun" defaultValue="their">
            <option value="her">her</option>
            <option value="his">his</option>
            <option value="their">their</option>
          </select>
        </label>
      </div>
      <div className="split">
        <label>
          Pet name
          <input name="petName" maxLength={40} />
        </label>
        <label>
          Pet
          <input name="petSpecies" defaultValue="cat" maxLength={24} />
        </label>
      </div>
      <label>
        Child photo
        <input name="childPhoto" type="file" accept="image/*" />
      </label>
      <label>
        Pet photo
        <input name="petPhoto" type="file" accept="image/*" />
      </label>
      <div className="split">
        <label>
          Date
          <input name="date" required placeholder="25.05.1996" />
        </label>
        <label>
          Time
          <input name="time" placeholder="15:00" />
        </label>
      </div>
      <label>
        Venue
        <input name="venue" placeholder="McDonalds Centru" />
      </label>
      <label>
        Address
        <input name="address" />
      </label>
      <label>
        Map URL
        <input name="mapUrl" placeholder="https://" />
      </label>
      <label>
        Host line
        <input name="host" placeholder="Contact Vasile" />
      </label>
      <label>
        WhatsApp number
        <input name="whatsappNumber" placeholder="+15551234567" inputMode="tel" />
      </label>
      <label>
        RSVP deadline
        <input name="rsvpDeadline" />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Cutting out the photos…" : "Make the invite"}
      </button>
      {result ? (
        <div className="studio-result" role="status">
          <p>
            Invite ready at <a href={result.url}>{result.url}</a>
          </p>
          <p>
            After wildcard DNS: <strong>{result.host}</strong>
          </p>
          <p>Photo job: {result.photoJob.status}</p>
          <ul>
            {result.photoJob.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p>Stored in {result.storage}. Without Upstash or Neon, open the link in this browser.</p>
        </div>
      ) : null}
    </form>
  );
}
