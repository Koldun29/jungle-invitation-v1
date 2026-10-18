const RESERVED = new Set(["www", "app", "dino", "create", "api", "youin", "mail", "admin"]);

/** Map `corina.youin.lol` to `corina`. Flagship and platform hosts stay on their own paths. */
export function inviteSlugFromHost(host: string, rootDomain = "youin.lol"): string | null {
  const hostname = host.split(":")[0].toLowerCase().replace(/\.$/, "");
  const root = rootDomain.toLowerCase();
  if (!hostname || hostname === root || hostname === `www.${root}`) return null;
  const suffix = `.${root}`;
  if (!hostname.endsWith(suffix)) return null;
  const sub = hostname.slice(0, -suffix.length);
  if (!sub || sub.includes(".") || RESERVED.has(sub)) return null;
  if (!/^[a-z0-9-]{2,40}$/.test(sub)) return null;
  return sub;
}

export function slugifyName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "party";
}
