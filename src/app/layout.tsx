import type { Metadata } from "next";
import { AuthNav } from "@/components/layout/auth-nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "\u6816\u7f8e\u5730 | \u4eb2\u5b50\u5468\u672b\u6237\u5916\u6307\u5357",
  description: "\u6816\u7f8e\u5730\u662f\u9762\u5411\u4eb2\u5b50\u5bb6\u5ead\u7684\u5468\u672b\u6237\u5916\u76ee\u7684\u5730\u63a8\u8350\u5e73\u53f0\uff0c\u805a\u7126\u9732\u8425\u3001\u6eaf\u6eaa\u3001\u5f92\u6b65\u548c\u91ce\u9910\u3002",
  manifest: "/manifest.webmanifest",
  applicationName: "\u6816\u7f8e\u5730",
  appleWebApp: {
    capable: true,
    title: "\u6816\u7f8e\u5730",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" }
    ]
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  let isAdmin = false;

  if (user) {
    const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    isAdmin = Boolean(data);
  }

  return (
    <html lang="zh-CN">
      <body className="bg-slate-50 pb-16 text-slate-800 antialiased md:pb-0">
        <AuthNav locale={locale} email={user?.email ?? null} isAdmin={isAdmin} />
        {children}
        <InstallPrompt />
        <MobileTabBar locale={locale} isSignedIn={Boolean(user)} />
      </body>
    </html>
  );
}
