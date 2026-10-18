"use client";

type Props = {
  text: string;
  className?: string;
  as?: "span" | "h1" | "h2";
  id?: string;
};

export function KineticTitle({ text, className, as = "span", id }: Props) {
  const Tag = as;
  return (
    <Tag className={className} id={id} aria-label={text}>
      {Array.from(text).map((char, index) => (
        <span
          key={`${char}-${index}`}
          className={char === " " ? "letter space" : "letter"}
          style={{ animationDelay: `${Math.min(index, 16) * 28}ms` }}
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </Tag>
  );
}

export function WordLine({ text, className }: { text: string; className?: string }) {
  const words = text.split(/(\s+)/);
  let delay = 0;
  return (
    <p className={className}>
      {words.map((word, index) => {
        if (!word.trim()) return <span key={index}>{word}</span>;
        const current = delay;
        delay += 35;
        return (
          <span key={index} className="word" style={{ animationDelay: `${180 + current}ms` }}>
            {word}
          </span>
        );
      })}
    </p>
  );
}
