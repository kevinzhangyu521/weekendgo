"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(navigatorWithStandalone.standalone);
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    if (isStandalone() || localStorage.getItem("qimeide-pwa-dismissed") === "1") return;

    const timer = window.setTimeout(() => setVisible(true), 1200);
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstall() {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
        localStorage.setItem("qimeide-pwa-dismissed", "1");
      }
      return;
    }

    setShowGuide(true);
  }

  function dismiss() {
    localStorage.setItem("qimeide-pwa-dismissed", "1");
    setVisible(false);
  }

  if (!visible || isStandalone()) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 rounded-2xl border border-emerald-100 bg-white p-4 shadow-2xl shadow-slate-900/15 md:hidden">
      <button onClick={dismiss} className="absolute right-3 top-3 rounded-full p-1 text-slate-400" aria-label="\u5173\u95ed\u6dfb\u52a0\u684c\u9762\u63d0\u793a">
        <X className="h-4 w-4" />
      </button>
      <div className="pr-7">
        <p className="text-sm font-bold text-slate-900">{"\u628a\u6816\u7f8e\u5730\u6dfb\u52a0\u5230\u624b\u673a\u684c\u9762"}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{"\u4ee5\u540e\u50cf App \u4e00\u6837\u6253\u5f00\uff0c\u4e0d\u7528\u6bcf\u6b21\u627e\u7f51\u5740\u3002"}</p>
      </div>
      <button onClick={handleInstall} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
        <Download className="h-4 w-4" />
        {"\u6dfb\u52a0\u5230\u624b\u673a\u684c\u9762"}
      </button>

      {showGuide ? (
        <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
          {isIos()
            ? "\u0069\u0050\u0068\u006f\u006e\u0065\u002f\u0069\u0050\u0061\u0064\uff1a\u8bf7\u70b9\u51fb\u6d4f\u89c8\u5668\u5e95\u90e8\u6216\u9876\u90e8\u7684\u5206\u4eab\u6309\u94ae\uff0c\u7136\u540e\u9009\u62e9\u201c\u6dfb\u52a0\u5230\u4e3b\u5c4f\u5e55\u201d\u3002"
            : "\u5b89\u5353\u624b\u673a\uff1a\u5982\u679c\u6ca1\u6709\u5f39\u51fa\u5b89\u88c5\u7a97\u53e3\uff0c\u8bf7\u70b9\u51fb\u6d4f\u89c8\u5668\u53f3\u4e0a\u89d2\u83dc\u5355\uff0c\u7136\u540e\u9009\u62e9\u201c\u5b89\u88c5\u5e94\u7528\u201d\u6216\u201c\u6dfb\u52a0\u5230\u4e3b\u5c4f\u5e55\u201d\u3002"}
        </div>
      ) : null}
    </div>
  );
}
