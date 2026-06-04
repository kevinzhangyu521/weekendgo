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

export function destinationProvince(item: DestinationItem, locale: Locale) {
  return locale === "zh" ? item.provinceZh || item.province || "" : item.province || "";
}

export function destinationRegion(item: DestinationItem, locale: Locale) {
  const province = destinationProvince(item, locale);
  const city = destinationCity(item, locale);
  if (!province || province === city) return city;
  return `${province} ${city}`;
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

export function destinationFamilyHighlight(item: DestinationItem, locale: Locale) {
  const scenarioText: Record<Scenario, { en: string; zh: string }> = {
    camping: {
      en: "Good for a relaxed family camping day",
      zh: "\u9002\u5408\u4eb2\u5b50\u8f7b\u677e\u9732\u8425"
    },
    creek: {
      en: "Good for cooling off and creek play",
      zh: "\u9002\u5408\u5e26\u5b69\u5b50\u73a9\u6c34\u6eaf\u6eaa"
    },
    hiking: {
      en: "Good for a light family walk",
      zh: "\u9002\u5408\u4eb2\u5b50\u8f7b\u5f92\u6b65"
    },
    picnic: {
      en: "Good for picnic, photos and slow weekends",
      zh: "\u9002\u5408\u91ce\u9910\u62cd\u7167\u548c\u653e\u677e"
    }
  };

  return locale === "zh" ? scenarioText[item.scenario].zh : scenarioText[item.scenario].en;
}

export function destinationSafetyTip(item: DestinationItem, locale: Locale) {
  const tip: Record<Safety, { en: string; zh: string }> = {
    low_risk: {
      en: "Low risk, still watch children near water and slopes.",
      zh: "\u98ce\u9669\u8f83\u4f4e\uff0c\u4ecd\u9700\u7559\u610f\u6c34\u8fb9\u548c\u5761\u9053\u3002"
    },
    medium_risk: {
      en: "Bring non-slip shoes and keep children in sight.",
      zh: "\u5efa\u8bae\u7a7f\u9632\u6ed1\u978b\uff0c\u5b69\u5b50\u5168\u7a0b\u5728\u89c6\u7ebf\u5185\u3002"
    },
    high_risk: {
      en: "More suitable for experienced families; avoid bad weather.",
      zh: "\u66f4\u9002\u5408\u6709\u7ecf\u9a8c\u5bb6\u5ead\uff0c\u96e8\u5929\u4e0d\u5efa\u8bae\u524d\u5f80\u3002"
    }
  };

  return locale === "zh" ? tip[item.safety].zh : tip[item.safety].en;
}

export function destinationDecisionTags(item: DestinationItem, locale: Locale) {
  if (locale === "zh") {
    return [
      `${item.minKidAge}\u5c81+`,
      item.hasParking ? "\u53ef\u505c\u8f66" : "\u505c\u8f66\u4e00\u822c",
      item.hasToilet ? "\u6709\u5395\u6240" : "\u5395\u6240\u8f83\u5c11",
      item.difficulty === "easy" ? "\u65b0\u624b\u53cb\u597d" : item.difficulty === "moderate" ? "\u9700\u4e00\u70b9\u4f53\u529b" : "\u9002\u5408\u5927\u5b69\u5b50"
    ];
  }

  return [
    `${item.minKidAge}+ years`,
    item.hasParking ? "Parking" : "Limited parking",
    item.hasToilet ? "Toilet" : "Limited toilet",
    item.difficulty === "easy" ? "Beginner friendly" : item.difficulty === "moderate" ? "Some stamina" : "Older kids"
  ];
}
