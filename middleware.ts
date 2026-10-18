import { NextResponse, type NextRequest } from "next/server";
import { inviteSlugFromHost } from "@/invites/host";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const slug = inviteSlugFromHost(host, process.env.INVITE_ROOT_DOMAIN || "youin.lol");
  if (!slug) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname !== "/") return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/i/${slug}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|themes/|invites/|fonts/|api/).*)"],
};
