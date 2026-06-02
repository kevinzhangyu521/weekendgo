import type { Metadata } from "next";
import { AuthNav } from "@/components/layout/auth-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeekendGo | \u5468\u672b\u53bb\u54ea\u513f",
  description: "\u9762\u541125-40\u5c81\u4eb2\u5b50\u5bb6\u5ead\u7684\u5468\u672b\u6237\u5916\u76ee\u7684\u5730\u63a8\u8350\u5e73\u53f0"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-50 text-slate-800 antialiased">
        <AuthNav />
        {children}
      </body>
    </html>
  );
}
