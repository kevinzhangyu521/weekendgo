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

export function destinationTripDuration(item: DestinationItem, locale: Locale) {
  const duration: Record<Scenario, { en: string; zh: string }> = {
    camping: { en: "Half-day to full-day", zh: "\u534a\u65e5\u5230\u4e00\u65e5" },
    creek: { en: "2-4 hours", zh: "2-4 \u5c0f\u65f6" },
    hiking: { en: "2-5 hours", zh: "2-5 \u5c0f\u65f6" },
    picnic: { en: "2-3 hours", zh: "2-3 \u5c0f\u65f6" }
  };

  return locale === "zh" ? duration[item.scenario].zh : duration[item.scenario].en;
}

export function destinationBestFor(item: DestinationItem, locale: Locale) {
  const bestFor: Record<Scenario, { en: string; zh: string }> = {
    camping: { en: "Families who want a slower outdoor day", zh: "\u60f3\u6162\u8282\u594f\u653e\u677e\u7684\u4eb2\u5b50\u5bb6\u5ead" },
    creek: { en: "Families who want water play and cooling off", zh: "\u60f3\u73a9\u6c34\u3001\u907f\u6691\u7684\u4eb2\u5b50\u5bb6\u5ead" },
    hiking: { en: "Families who want light exercise", zh: "\u60f3\u8f7b\u91cf\u8fd0\u52a8\u7684\u4eb2\u5b50\u5bb6\u5ead" },
    picnic: { en: "Families who want photos, food and open space", zh: "\u60f3\u91ce\u9910\u3001\u62cd\u7167\u548c\u653e\u98ce\u7684\u5bb6\u5ead" }
  };

  return locale === "zh" ? bestFor[item.scenario].zh : bestFor[item.scenario].en;
}

export function destinationPackingList(item: DestinationItem, locale: Locale) {
  const sharedZh = ["\u996e\u7528\u6c34", "\u9632\u6652\u9632\u868a", "\u7eb8\u5dfe\u548c\u5783\u573e\u888b"];
  const sharedEn = ["Water", "Sun and mosquito protection", "Tissues and trash bags"];

  const scenarioZh: Record<Scenario, string[]> = {
    camping: ["\u91ce\u9910\u57ab\u6216\u9732\u8425\u6905", "\u5929\u5e55\u6216\u906e\u9633\u5e03"],
    creek: ["\u9632\u6ed1\u978b", "\u66ff\u6362\u8863\u7269"],
    hiking: ["\u8f7b\u4fbf\u80cc\u5305", "\u9002\u5408\u8d70\u8def\u7684\u978b"],
    picnic: ["\u91ce\u9910\u57ab", "\u4fbf\u643a\u98df\u7269"]
  };

  const scenarioEn: Record<Scenario, string[]> = {
    camping: ["Picnic mat or camping chairs", "Canopy or shade cloth"],
    creek: ["Non-slip shoes", "Spare clothes"],
    hiking: ["Light backpack", "Comfortable walking shoes"],
    picnic: ["Picnic mat", "Portable food"]
  };

  return locale === "zh" ? [...scenarioZh[item.scenario], ...sharedZh] : [...scenarioEn[item.scenario], ...sharedEn];
}
