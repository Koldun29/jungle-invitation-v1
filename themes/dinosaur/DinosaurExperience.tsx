"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { Invite } from "@/invites/schema";
import { ordinal } from "@/invites/logic";
import { useAudio } from "@/engine/audio/AudioProvider";
import { pulse } from "@/engine/input/haptics";
import { useShell } from "@/engine/runtime/shell";
import { KineticTitle, WordLine } from "@/engine/typography/KineticTitle";
import { RsvpPanel } from "@/engine/rsvp/RsvpPanel";
import "./dinosaur.css";

const ART = {
  jungle: "/themes/dinosaur/jungle.webp",
  ride: "/themes/dinosaur/ride.webp",
  grotto: "/themes/dinosaur/grotto.webp",
  party: "/themes/dinosaur/party.webp",
  heroIntro: "/themes/dinosaur/hero-intro.webp",
  heroRide: "/themes/dinosaur/hero-ride.webp",
  heroDig: "/themes/dinosaur/hero-dig.webp",
  heroPartyChild: "/themes/dinosaur/hero-party-child.webp",
  heroPartyPet: "/themes/dinosaur/hero-party-pet.webp",
  fossil: "/themes/dinosaur/fossil.webp",
};

export function DinosaurExperience() {
  const { scene } = useShell();
  return (
    <>
      {scene === 0 ? <Intro /> : null}
      {scene === 1 ? <Ride /> : null}
      {scene === 2 ? <Dig /> : null}
      {scene === 3 ? <Party /> : null}
    </>
  );
}

function alts(invite: Invite) {
  if (invite.slug === "corina") {
    return {
      child: "Corina, a young girl with dark hair tied back, wearing a light blue collared shirt",
      pet: "Corina's grey and white tabby cat with amber eyes, lying down",
    };
  }
  return {
    child: `${invite.childName}'s photo, cut out as a jungle sticker`,
    pet: `${invite.childName}'s ${invite.petSpecies || "pet"}, cut out as a jungle sticker`,
  };
}

function Intro() {
  const { invite, goTo } = useShell();
  const audio = useAudio();
  const [childOk, setChildOk] = useState(Boolean(invite.photos.childSticker));
  const [petOk, setPetOk] = useState(Boolean(invite.photos.petSticker));
  const alt = alts(invite);
  const pet = invite.petSpecies || "cat";
  return (
    <section className="scene scene-intro" aria-labelledby="title">
      <img className="plate" src={ART.jungle} alt="An illustrated jungle with waterfalls and a distant volcano" fetchPriority="high" />
      <header className="copy">
        <p className="eyebrow">Somewhere deep in the jungle…</p>
        <h1 id="title" className="title" aria-label={`${invite.childName}’s big adventure`}>
          <KineticTitle className="name gold" text={`${invite.childName.toLocaleUpperCase()}’S`} />
          <KineticTitle className="adventure" text="BIG ADVENTURE!" />
        </h1>
        <WordLine className="story" text={`A little explorer. A curious ${pet}. And a very big surprise…`} />
      </header>
      <div className="cast">
        {childOk ? (
          <img className="pin pin-child" src={invite.photos.childSticker} alt={alt.child} fetchPriority="high" onError={() => setChildOk(false)} />
        ) : (
          <img className="pin pin-child illus" src={ART.heroIntro} alt={`${invite.childName} and her ${pet} in matching explorer outfits, ready for an adventure`} />
        )}
        {petOk ? (
          <img className="pin pin-pet" src={invite.photos.petSticker} alt={alt.pet} onError={() => setPetOk(false)} />
        ) : null}
      </div>
      <button
        type="button"
        className="wood"
        onClick={() => {
          audio.start();
          audio.tap();
          pulse(12);
          goTo(1);
        }}
      >
        LET’S EXPLORE! <span aria-hidden="true">›</span>
      </button>
    </section>
  );
}

function Ride() {
  const { invite, goTo, shake } = useShell();
  const audio = useAudio();
  const moved = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const [roaring, setRoaring] = useState(false);
  const alt = alts(invite);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.to(".dino", { y: -7, rotation: -0.8, duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut" });
    });
    return () => ctx.revert();
  }, []);

  const ride = () => {
    audio.start();
    audio.roar();
    pulse([16, 28, 40, 24, 80]);
    shake();
    setRoaring(true);
    window.setTimeout(() => goTo(2), 380);
  };

  return (
    <section className="scene scene-ride" aria-labelledby="ride-title">
      <img className="plate" src={ART.ride} alt="A sunlit fern forest with giant ancient trees, hanging vines and a winding path" />
      <header className="copy">
        <p className="eyebrow">Two explorers. One enormous new friend.</p>
        <h2 id="ride-title" className="title" aria-label="Hop on">
          <KineticTitle className="name gold" text="HOP" />
          <KineticTitle className="adventure" text="ON!" />
        </h2>
        <p className="story">
          <span className="word">He</span> <span className="word" style={{ animationDelay: "220ms" }}>knows</span>{" "}
          <span className="word" style={{ animationDelay: "255ms" }}>the</span> <span className="word" style={{ animationDelay: "290ms" }}>way…</span>{" "}
          <em className="word" style={{ animationDelay: "340ms" }}>probably!</em>
        </p>
      </header>
      <button
        type="button"
        className="dino art"
        aria-label={`Ride the long-neck dinosaur. ${invite.childName} and her ${invite.petSpecies || "cat"} are along for the walk.`}
        onPointerDown={(event) => {
          moved.current = false;
          origin.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const dx = event.clientX - origin.current.x;
          const dy = event.clientY - origin.current.y;
          if (Math.hypot(dx, dy) > 16) moved.current = true;
          event.currentTarget.style.translate = `${dx}px ${dy}px`;
        }}
        onPointerUp={(event) => {
          event.currentTarget.style.translate = "";
        }}
        onClick={() => {
          if (moved.current) {
            moved.current = false;
            return;
          }
          ride();
        }}
      >
        <img src={ART.heroRide} alt="" />
        {roaring ? <span className="roar-burst">ROAR!</span> : null}
      </button>
      {invite.photos.childSticker ? <img className="badge badge-child" src={invite.photos.childSticker} alt={alt.child} /> : null}
      {invite.photos.petSticker ? <img className="badge badge-pet" src={invite.photos.petSticker} alt={alt.pet} /> : null}
      <p className="tap-hint">Tap the dinosaur to catch a ride. Drag it if you want to play.</p>
      <Back to={0} />
    </section>
  );
}

function Dig() {
  const { invite, goTo } = useShell();
  const audio = useAudio();
  const [digs, setDigs] = useState(0);
  const [dust, setDust] = useState(0);
  const revealed = digs >= 3;
  const petPhrase = invite.petName
    ? `${invite.petName} insists it’s treasure.`
    : `${invite.childPronoun.charAt(0).toUpperCase()}${invite.childPronoun.slice(1)} ${invite.petSpecies || "cat"} insists it’s treasure.`;

  const hints = ["Tap the little mound 3 times to uncover it.", "A little deeper…", "Something blue is peeking through!", "Tap the fossil to find the party."];

  return (
    <section className="scene scene-dig" aria-labelledby="dig-title">
      <img className="plate" src={ART.grotto} alt="A sunlit sandstone grotto with hanging vines and glowing turquoise crystals" />
      <header className="copy">
        <p className="eyebrow">Wait… what’s hiding down there?</p>
        <h2 id="dig-title" className="title" aria-label="Dig up the secret">
          <KineticTitle className="name gold" text="DIG UP" />
          <KineticTitle className="adventure" text="THE SECRET!" />
        </h2>
        {revealed ? (
          <p className="story clue" role="status">
            A prehistoric <strong>party clue!</strong>
          </p>
        ) : (
          <p className="story">
            {invite.childName} spotted something blue.
            <br />
            {petPhrase}
          </p>
        )}
      </header>
      <img
        className="dig-hero"
        src={ART.heroDig}
        alt={`${invite.childName} kneels with a magnifying glass while her ${invite.petSpecies || "cat"} investigates a blue fossil`}
      />
      <button
        type="button"
        className="fossil"
        data-dig={digs}
        aria-expanded={revealed}
        aria-label={revealed ? "Continue to the party" : `Dig for the fossil. ${hints[digs]}`}
        onClick={() => {
          audio.start();
          if (revealed) {
            audio.tap();
            goTo(3);
            return;
          }
          audio.dig();
          pulse(digs === 2 ? [12, 20, 28] : 14);
          setDust((value) => value + 1);
          setDigs((value) => Math.min(3, value + 1));
        }}
      >
        <svg className="mound" viewBox="0 0 220 110" aria-hidden="true">
          <ellipse cx="110" cy="92" rx="90" ry="12" fill="#70421e" opacity="0.2" />
          <path d="M18 90 Q40 86 52 70 Q66 50 86 54 Q112 34 142 54 Q164 52 180 74 Q194 88 204 90 Q112 106 18 90Z" fill="#e2b56a" />
          <path className="crack" d="M104 56 L96 70 L110 76 L101 92 M110 76 L128 68 L144 80" fill="none" stroke="#8a4e1e" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <img className="relic" src={ART.fossil} alt="A turquoise spiral fossil in an irregular blue stone" />
        <span key={dust} className="dusts" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => (
            <i key={index} style={{ ["--dx" as string]: `${(index - 3) * 14}px`, ["--dy" as string]: `${-18 - (index % 3) * 10}px` }} />
          ))}
        </span>
      </button>
      <p className="tap-hint" aria-live="polite">
        {hints[digs]}
      </p>
      <Back to={1} />
    </section>
  );
}

function Party() {
  const { invite, goTo } = useShell();
  const audio = useAudio();
  const [hatched, setHatched] = useState(0);
  const [childOk, setChildOk] = useState(Boolean(invite.photos.childSticker));
  const [petOk, setPetOk] = useState(Boolean(invite.photos.petSticker));
  const alt = alts(invite);
  const tagline = `A ROAR-SOME ${ordinal(invite.age).toUpperCase()} BIRTHDAY`;

  return (
    <section className="scene scene-party" aria-labelledby="party-title">
      <img className="plate" src={ART.party} alt="A sunset jungle celebration with colorful bunting and balloons" />
      <header className="copy">
        <p className="eyebrow">Surprise! The adventure was leading here…</p>
        <h2 id="party-title" className="title" aria-label="You’re invited">
          <KineticTitle className="name gold" text="YOU’RE" />
          <KineticTitle className="adventure" text="INVITED!" />
        </h2>
      </header>
      <div className="party-scroll">
        <div className="party-cast">
          <img
            className="party-pin"
            src={childOk ? invite.photos.childSticker : ART.heroPartyChild}
            alt={childOk ? alt.child : `${invite.childName} holding a birthday cake`}
            onError={() => setChildOk(false)}
          />
          <button
            type="button"
            className={`egg egg-${hatched}`}
            onClick={() => {
              audio.start();
              const next = Math.min(2, hatched + 1);
              setHatched(next);
              if (next === 2) {
                audio.hatch();
                pulse([10, 30, 10, 40]);
              } else {
                audio.tap();
                pulse(8);
              }
            }}
            aria-label={hatched === 2 ? `${invite.childName} is turning ${invite.age}` : "Tap the egg to hatch the age"}
          >
            <span className="shell" aria-hidden="true" />
            <span className="yolk">{hatched === 2 ? invite.age : ""}</span>
          </button>
          <img
            className="party-pin pet"
            src={petOk ? invite.photos.petSticker : ART.heroPartyPet}
            alt={petOk ? alt.pet : `${invite.childName}'s ${invite.petSpecies || "cat"} in a party hat`}
            onError={() => setPetOk(false)}
          />
        </div>
        <RsvpPanel invite={invite} tagline={tagline} />
        <button type="button" className="replay" onClick={() => goTo(0)}>
          ↻ Replay the story
        </button>
      </div>
      <Back to={2} />
    </section>
  );
}

function Back({ to }: { to: number }) {
  const { goTo } = useShell();
  return (
    <button type="button" className="back" onClick={() => goTo(to)}>
      ‹ Back
    </button>
  );
}
