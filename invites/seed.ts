import type { Invite } from "@/invites/schema";

/**
 * Flagship invite. Party fields match the previous storybook config exactly:
 * date 25.05.1996, venue "McDonalds Centru", host line "Contact Vasile".
 * No phone number was supplied, so whatsappNumber stays empty.
 */
export const corinaInvite: Invite = {
  slug: "corina",
  themeId: "dinosaur",
  childName: "Corina",
  childPronoun: "her",
  age: 7,
  petName: "",
  petSpecies: "cat",
  date: "25.05.1996",
  time: "",
  timezone: "",
  venue: "McDonalds Centru",
  address: "",
  mapUrl: "",
  host: "Contact Vasile",
  whatsappNumber: "",
  rsvpDeadline: "",
  photos: {
    child: "/invites/corina/inputs/corina.jpg",
    pet: "/invites/corina/inputs/cat.jpg",
    childSticker: "/invites/corina/stickers/corina.webp",
    petSticker: "/invites/corina/stickers/cat.webp",
    treatment: "cached-sticker",
  },
};

export const FLAGSHIP_SLUG = corinaInvite.slug;
