"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Invite } from "@/invites/schema";
import { formatPartyDate, googleCalendarLink, mapHref, whatsAppLink, whatsAppMessage } from "@/invites/logic";

type Status = { tone: "ok" | "err"; text: string; persisted?: boolean } | null;

export function RsvpPanel({ invite, tagline }: { invite: Invite; tagline: string }) {
  const when = formatPartyDate(invite.date, invite.time, invite.timezone);
  const map = mapHref(invite);
  const calendar = googleCalendarLink(invite);
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no" | "maybe">("yes");
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const message = useMemo(
    () =>
      whatsAppMessage({
        guestName: name,
        adults,
        kids,
        attending,
        childName: invite.childName,
        when,
        venue: invite.venue,
      }),
    [adults, attending, invite.childName, invite.venue, kids, name, when],
  );
  const whatsapp = invite.whatsappNumber ? whatsAppLink(invite.whatsappNumber, message) : null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: invite.slug,
          name,
          attending,
          adults,
          kids,
          note,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string; storage?: string };
      if (!response.ok || !payload.ok) {
        setStatus({ tone: "err", text: payload.error || "The RSVP could not be sent. Try again." });
        return;
      }
      const kept = payload.storage === "upstash" || payload.storage === "neon";
      setStatus({
        tone: "ok",
        persisted: kept,
        text: kept
          ? `You're on the list, ${name.trim()}.`
          : `You're on the list, ${name.trim()}. This reply is kept for this visit until the host connects storage.`,
      });
    } catch {
      setStatus({ tone: "err", text: "The RSVP could not be sent. Check the connection and try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="pass" id="party-details" tabIndex={-1} aria-label="Party details">
      <h3>
        {invite.childName} is turning {invite.age}!
      </h3>
      <p className="pass-tag">{tagline}</p>
      <div className="pass-rule" aria-hidden="true" />
      <dl>
        <div>
          <dt>The big day</dt>
          <dd>{when}</dd>
        </div>
        <div>
          <dt>Where the adventure ends</dt>
          <dd>
            {map ? (
              <a href={map} target="_blank" rel="noopener noreferrer">
                {invite.venue || invite.address}
              </a>
            ) : (
              invite.venue || "Location coming soon"
            )}
          </dd>
        </div>
        <div>
          <dt>Joining the expedition?</dt>
          <dd>{invite.host || "RSVP details coming soon"}</dd>
        </div>
      </dl>
      {invite.rsvpDeadline ? <p className="deadline">Please reply by {invite.rsvpDeadline}.</p> : null}

      <div className="cal-row">
        <a className="text-btn" href={`/api/calendar/${invite.slug}`}>
          Add to calendar
        </a>
        {calendar ? (
          <a className="text-btn" href={calendar} target="_blank" rel="noopener noreferrer">
            Google Calendar
          </a>
        ) : null}
      </div>

      {whatsapp ? (
        <a className="wa" href={whatsapp} target="_blank" rel="noopener noreferrer">
          Reply on WhatsApp
        </a>
      ) : null}

      {status?.tone === "ok" ? (
        <p className="rsvp-status" role="status">
          {status.text}
        </p>
      ) : (
        <form className="rsvp-form" onSubmit={onSubmit}>
          <label>
            Your name
            <input value={name} onChange={(event) => setName(event.target.value)} name="name" required autoComplete="name" maxLength={80} />
          </label>
          <fieldset>
            <legend>Attending</legend>
            <div className="choices">
              {(
                [
                  ["yes", "Yes"],
                  ["maybe", "Maybe"],
                  ["no", "Can't"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className={attending === value ? "choice on" : "choice"}>
                  <input
                    type="radio"
                    name="attending"
                    value={value}
                    checked={attending === value}
                    onChange={() => setAttending(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="counts">
            <Stepper label="Adults" value={adults} min={0} onChange={setAdults} />
            <Stepper label="Kids" value={kids} min={0} onChange={setKids} />
          </div>
          <label>
            Note
            <textarea value={note} onChange={(event) => setNote(event.target.value)} name="note" maxLength={280} rows={2} />
          </label>
          {status?.tone === "err" ? (
            <p className="rsvp-status err" role="alert">
              {status.text}
            </p>
          ) : null}
          <button className="send" type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send RSVP"}
          </button>
        </form>
      )}
    </section>
  );
}

function Stepper({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (value: number) => void }) {
  return (
    <div className="stepper">
      <span id={`${label}-label`}>{label}</span>
      <div>
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} onClick={() => onChange(Math.max(min, value - 1))}>
          –
        </button>
        <input
          aria-labelledby={`${label}-label`}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(Math.max(min, Math.min(20, Number(event.target.value) || 0)))}
        />
        <button type="button" aria-label={`More ${label.toLowerCase()}`} onClick={() => onChange(Math.min(20, value + 1))}>
          +
        </button>
      </div>
    </div>
  );
}
