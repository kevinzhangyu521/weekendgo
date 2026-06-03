import type { Metadata } from "next";
import { AuthNav } from "@/components/layout/auth-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "\u6816\u7f8e\u5730 | \u4eb2\u5b50\u5468\u672b\u6237\u5916\u6307\u5357",
  description: "\u6816\u7f8e\u5730\u662f\u9762\u5411\u4eb2\u5b50\u5bb6\u5ead\u7684\u5468\u672b\u6237\u5916\u76ee\u7684\u5730\u63a8\u8350\u5e73\u53f0\uff0c\u805a\u7126\u9732\u8425\u3001\u6eaf\u6eaa\u3001\u5f92\u6b65\u548c\u91ce\u9910\u3002"
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
