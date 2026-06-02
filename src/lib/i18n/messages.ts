import type { Locale } from "./config";

function byLocale(locale: Locale, en: string, zh: string) {
  return zh;
}

export function getLoginMessages(locale: Locale) {
  return {
    magicLinkSent: byLocale(locale, "Magic link sent. Please check your email.", "\u9b54\u6cd5\u94fe\u63a5\u5df2\u53d1\u9001\uff0c\u8bf7\u67e5\u6536\u90ae\u7bb1\u3002"),
    loginFailed: byLocale(locale, "Login failed. Please try again.", "\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002"),
    signedOut: byLocale(locale, "Signed out.", "\u5df2\u9000\u51fa\u767b\u5f55\u3002"),
    title: byLocale(locale, "Sign in with email", "\u90ae\u7bb1\u9a8c\u8bc1\u767b\u5f55"),
    subtitle: byLocale(locale, "We will send a secure magic link to your inbox.", "\u6211\u4eec\u4f1a\u5411\u4f60\u7684\u90ae\u7bb1\u53d1\u9001\u5b89\u5168\u767b\u5f55\u94fe\u63a5\u3002"),
    sending: byLocale(locale, "Sending...", "\u53d1\u9001\u4e2d..."),
    sendLink: byLocale(locale, "Send magic link", "\u53d1\u9001\u767b\u5f55\u94fe\u63a5"),
    signOut: byLocale(locale, "Sign out", "\u9000\u51fa\u767b\u5f55"),
    back: byLocale(locale, "Back", "\u8fd4\u56de"),
    home: byLocale(locale, "Home", "\u9996\u9875")
  };
}

export function getAddToPlanMessages(locale: Locale) {
  return {
    needSignIn: byLocale(locale, "Please sign in to add to a plan.", "\u8bf7\u5148\u767b\u5f55\u518d\u52a0\u5165\u8ba1\u5212\u3002"),
    added: byLocale(locale, "Added to your weekend plan.", "\u5df2\u52a0\u5165\u4f60\u7684\u5468\u672b\u8ba1\u5212\u3002"),
    addFailed: byLocale(locale, "Add to plan failed. Please try again.", "\u6dfb\u52a0\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002"),
    adding: byLocale(locale, "Adding...", "\u6dfb\u52a0\u4e2d..."),
    addToPlan: byLocale(locale, "Add to plan", "\u52a0\u5165\u8ba1\u5212"),
    signInFirst: byLocale(locale, "Sign in first", "\u5148\u53bb\u767b\u5f55")
  };
}

export function getPlanEditorMessages(locale: Locale) {
  return {
    saveFailed: byLocale(locale, "Save failed.", "\u4fdd\u5b58\u5931\u8d25\u3002"),
    planUpdated: byLocale(locale, "Plan updated.", "\u8ba1\u5212\u5df2\u66f4\u65b0\u3002"),
    removeFailed: byLocale(locale, "Remove failed.", "\u5220\u9664\u5931\u8d25\u3002"),
    stopRemoved: byLocale(locale, "Stop removed.", "\u7ad9\u70b9\u5df2\u79fb\u9664\u3002"),
    reorderFailed: byLocale(locale, "Reorder failed.", "\u6392\u5e8f\u5931\u8d25\u3002"),
    orderUpdated: byLocale(locale, "Order updated.", "\u987a\u5e8f\u5df2\u66f4\u65b0\u3002"),
    confirmDeletePlan: byLocale(locale, "Delete this plan?", "\u786e\u5b9a\u5220\u9664\u8fd9\u4e2a\u8ba1\u5212\uff1f"),
    deleteFailed: byLocale(locale, "Delete failed.", "\u5220\u9664\u5931\u8d25\u3002"),
    shareUpdateFailed: byLocale(locale, "Share update failed.", "\u5206\u4eab\u8bbe\u7f6e\u5931\u8d25\u3002"),
    publicShareEnabled: byLocale(locale, "Public sharing enabled.", "\u5df2\u5f00\u542f\u516c\u5f00\u5206\u4eab\u3002"),
    publicShareDisabled: byLocale(locale, "Public sharing disabled.", "\u5df2\u5173\u95ed\u516c\u5f00\u5206\u4eab\u3002"),
    shareLinkCopied: byLocale(locale, "Share link copied.", "\u5206\u4eab\u94fe\u63a5\u5df2\u590d\u5236\u3002"),
    clipboardCopied: byLocale(locale, "Link copied to clipboard.", "\u94fe\u63a5\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f\u3002"),
    qrPngDownloaded: byLocale(locale, "QR PNG downloaded.", "QR \u56fe\u5df2\u4e0b\u8f7d\u3002"),
    qrDownloadFailed: byLocale(locale, "QR download failed.", "QR \u4e0b\u8f7d\u5931\u8d25\u3002"),
    posterGenerationFailed: byLocale(locale, "Poster generation failed.", "\u5206\u4eab\u5361\u751f\u6210\u5931\u8d25\u3002"),
    shareCardDownloaded: byLocale(locale, "Share card PNG downloaded.", "\u5206\u4eab\u5361\u5df2\u4e0b\u8f7d\u3002"),
    planSettings: byLocale(locale, "Plan settings", "\u8ba1\u5212\u8bbe\u7f6e"),
    saving: byLocale(locale, "Saving...", "\u4fdd\u5b58\u4e2d..."),
    save: byLocale(locale, "Save", "\u4fdd\u5b58"),
    updating: byLocale(locale, "Updating...", "\u66f4\u65b0\u4e2d..."),
    disablePublicShare: byLocale(locale, "Disable public share", "\u5173\u95ed\u516c\u5f00\u5206\u4eab"),
    enablePublicShare: byLocale(locale, "Enable public share", "\u5f00\u542f\u516c\u5f00\u5206\u4eab"),
    copyShareLink: byLocale(locale, "Copy share link", "\u590d\u5236\u5206\u4eab\u94fe\u63a5"),
    hideQr: byLocale(locale, "Hide QR", "\u9690\u85cf QR"),
    showQr: byLocale(locale, "Show QR", "\u663e\u793a QR"),
    deleting: byLocale(locale, "Deleting...", "\u5220\u9664\u4e2d..."),
    deletePlan: byLocale(locale, "Delete plan", "\u5220\u9664\u8ba1\u5212"),
    scanToOpen: byLocale(locale, "Scan to open shared plan", "\u626b\u7801\u67e5\u770b\u5206\u4eab\u8ba1\u5212"),
    downloadQrPng: byLocale(locale, "Download QR PNG", "\u4e0b\u8f7d QR PNG"),
    downloadShareCardPng: byLocale(locale, "Download share card PNG", "\u4e0b\u8f7d\u5206\u4eab\u5361 PNG"),
    openPrintableCard: byLocale(locale, "Open printable card", "\u6253\u5f00\u6253\u5370\u5361\u7247"),
    noStopsYet: byLocale(locale, "No stops yet. Add destinations from detail pages.", "\u8fd8\u6ca1\u6709\u7ad9\u70b9\uff0c\u8bf7\u5728\u76ee\u7684\u5730\u8be6\u60c5\u9875\u6dfb\u52a0\u3002"),
    stop: byLocale(locale, "Stop", "\u7ad9\u70b9"),
    unknownDestination: byLocale(locale, "Unknown destination", "\u672a\u77e5\u76ee\u7684\u5730"),
    noDetails: byLocale(locale, "No details", "\u65e0\u8be6\u60c5"),
    navigate: byLocale(locale, "Navigate", "\u7acb\u5373\u5bfc\u822a"),
    moveUp: byLocale(locale, "Move up", "\u4e0a\u79fb"),
    moveDown: byLocale(locale, "Move down", "\u4e0b\u79fb"),
    remove: byLocale(locale, "Remove", "\u79fb\u9664")
  };
}
