"use client";

import { AlertCircle } from "lucide-react";

type Props = {
  destinationName: string;
};

export function DestinationFeedbackButton({ destinationName }: Props) {
  function openFeedback() {
    window.dispatchEvent(
      new CustomEvent("qimeide:open-feedback", {
        detail: {
          type: "place_error",
          contentPrefix: `地点「${destinationName}」信息可能有误：`
        }
      })
    );
  }

  return (
    <button
      type="button"
      onClick={openFeedback}
      className="interactive-button inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-800 hover:bg-amber-100"
    >
      <AlertCircle className="h-4 w-4" />
      信息有误？告诉我们
    </button>
  );
}
