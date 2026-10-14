import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { getCurrentUser } from "@/lib/auth";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export const metadata: Metadata = {
  title: {
    template: "%s | ResourceHub",
    default: "ResourceHub — Resource Reservation Management",
  },
  description:
    "PrimeWave Lab's centralized resource reservation management system.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = await getCurrentUser();

  // If a session cookie exists but the user was deleted/missing from DB,
  // clear the stale session to avoid trapping the user in a broken redirect loop.
  if (token && !user) {
    redirect("/api/auth/logout");
  }

  return (
    <html lang="en">
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:font-semibold focus:outline-none"
        >
          Skip to main content
        </a>
        <div className="flex h-screen overflow-hidden bg-slate-50">
          <Sidebar user={user} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <main id="main-content" className="flex-1 overflow-y-auto p-6 lg:p-8" tabIndex={-1}>
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
