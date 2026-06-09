import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const pathname = req.nextUrl.pathname;

    // dan_quan can only access /ho-so and /diem-danh
    const danQuanAllowed = ["/ho-so", "/diem-danh"];
    if (role === "dan_quan" && !danQuanAllowed.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/ho-so", req.url));
    }

    // non-admin cannot access user management
    if (role !== "admin" && pathname.startsWith("/quan-ly-nguoi-dung")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/((?!login|api/auth|_next|favicon.ico).*)",
  ],
};
