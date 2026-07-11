import type { Metadata } from "next";
import { AuthNav } from "@/components/layout/auth-nav";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getCurrentAuthWithAdmin } from "@/lib/auth/current-user";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/qimeide-icon.svg", sizes: "any", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const { user, isAdmin } = await getCurrentAuthWithAdmin();

  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AuthNav locale={locale} email={user?.email ?? null} isAdmin={isAdmin} />
        {children}
        <FeedbackWidget />
        <InstallPrompt />
      </body>
    </html>
  );
}
