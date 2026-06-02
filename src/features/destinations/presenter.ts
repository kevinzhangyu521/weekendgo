import type { Locale } from "@/lib/i18n/config";
import type { DestinationItem, Difficulty, Safety, Scenario } from "./types";

const scenarioLabelMap: Record<Scenario, { en: string; zh: string }> = {
  camping: { en: "Camping", zh: "\u9732\u8425" },
  creek: { en: "Creek", zh: "\u6eaf\u6eaa" },
  hiking: { en: "Hiking", zh: "\u5f92\u6b65" },
  picnic: { en: "Picnic", zh: "\u91ce\u9910" }
};

const difficultyLabelMap: Record<Difficulty, { en: string; zh: string }> = {
  easy: { en: "Easy", zh: "\u4f4e\u96be\u5ea6" },
  moderate: { en: "Moderate", zh: "\u4e2d\u96be\u5ea6" },
  hard: { en: "Hard", zh: "\u9ad8\u96be\u5ea6" }
};

const difficultyShortLabelMap: Record<Difficulty, { en: string; zh: string }> = {
  easy: { en: "Easy", zh: "\u4f4e" },
  moderate: { en: "Moderate", zh: "\u4e2d" },
  hard: { en: "Hard", zh: "\u9ad8" }
};

const safetyLabelMap: Record<Safety, { en: string; zh: string }> = {
  low_risk: { en: "Low Risk", zh: "\u4f4e\u98ce\u9669" },
  medium_risk: { en: "Medium Risk", zh: "\u4e2d\u98ce\u9669" },
  high_risk: { en: "High Risk", zh: "\u9ad8\u98ce\u9669" }
};

export function destinationName(item: DestinationItem, locale: Locale) {
  return locale === "zh" ? item.nameZh || item.name : item.name;
}

export function destinationCity(item: DestinationItem, locale: Locale) {
  return locale === "zh" ? item.cityZh || item.city : item.city;
}

export function destinationDescription(item: DestinationItem, locale: Locale) {
  return locale === "zh" ? item.descriptionZh || item.description : item.description;
}

export function destinationScenario(item: DestinationItem, locale: Locale) {
  return locale === "zh" ? scenarioLabelMap[item.scenario].zh : scenarioLabelMap[item.scenario].en;
}

export function destinationDifficulty(item: DestinationItem, locale: Locale) {
  return locale === "zh" ? difficultyLabelMap[item.difficulty].zh : difficultyLabelMap[item.difficulty].en;
}

export function destinationDifficultyShort(item: DestinationItem, locale: Locale) {
  return locale === "zh" ? difficultyShortLabelMap[item.difficulty].zh : difficultyShortLabelMap[item.difficulty].en;
}

export function destinationSafety(item: DestinationItem, locale: Locale) {
  return locale === "zh" ? safetyLabelMap[item.safety].zh : safetyLabelMap[item.safety].en;
}
