import assert from "node:assert/strict";
import test from "node:test";
import { inviteSlugFromHost, slugifyName } from "../invites/host";
import {
  buildIcs,
  formatPartyDate,
  googleCalendarLink,
  mapHref,
  ordinal,
  whatsAppLink,
  whatsAppMessage,
} from "../invites/logic";
import { inviteSchema } from "../invites/schema";
import { corinaInvite } from "../invites/seed";

test("flagship invite keeps the original party details", () => {
  const parsed = inviteSchema.parse(corinaInvite);
  assert.equal(parsed.childName, "Corina");
  assert.equal(parsed.age, 7);
  assert.equal(parsed.date, "25.05.1996");
  assert.equal(parsed.time, "");
  assert.equal(parsed.venue, "McDonalds Centru");
  assert.equal(parsed.address, "");
  assert.equal(parsed.host, "Contact Vasile");
  assert.equal(parsed.whatsappNumber, "");
  assert.equal(formatPartyDate(parsed.date, parsed.time, parsed.timezone), "25 May 1996");
  assert.equal(ordinal(parsed.age).toUpperCase(), "7TH");
});

test("subdomains route to a slug and reserved hosts do not", () => {
  assert.equal(inviteSlugFromHost("corina.youin.lol"), "corina");
  assert.equal(inviteSlugFromHost("corina.youin.lol:443"), "corina");
  assert.equal(inviteSlugFromHost("dino.youin.lol"), null);
  assert.equal(inviteSlugFromHost("youin.lol"), null);
  assert.equal(inviteSlugFromHost("www.youin.lol"), null);
  assert.equal(inviteSlugFromHost("jungle-invitation.vercel.app"), null);
  assert.equal(slugifyName("Corina"), "corina");
});

test("map, calendar, and WhatsApp links are built from the invite", () => {
  assert.equal(
    mapHref({ venue: "McDonalds Centru", address: "", mapUrl: "" }),
    "https://www.google.com/maps/search/?api=1&query=McDonalds%20Centru",
  );
  const message = whatsAppMessage({
    guestName: "Ana",
    adults: 2,
    kids: 1,
    attending: "yes",
    childName: "Corina",
    when: "25 May 1996",
    venue: "McDonalds Centru",
  });
  assert.equal(
    message,
    "Hi! This is Ana. We'll be there for Corina's birthday (25 May 1996) at McDonalds Centru. Adults: 2. Kids: 1.",
  );
  assert.equal(whatsAppLink("", message), null);
  assert.equal(
    whatsAppLink("+1 (555) 555-0100", message),
    `https://wa.me/15555550100?text=${encodeURIComponent(message)}`,
  );
  const google = googleCalendarLink(corinaInvite);
  assert.ok(google?.includes("dates=19960525%2F19960526"));
  assert.ok(google?.includes("McDonalds+Centru"));
  const ics = buildIcs(corinaInvite);
  assert.ok(ics?.includes("DTSTART;VALUE=DATE:19960525"));
  assert.ok(ics?.includes("DTEND;VALUE=DATE:19960526"));
  assert.ok(ics?.includes("McDonalds Centru"));
});
