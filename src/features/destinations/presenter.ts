import type { Locale } from "@/lib/i18n/config";
import { toChineseRegionName } from "@/lib/geo/region-names";
import type { DestinationItem, Difficulty, Safety, Scenario } from "./types";

const scenarioLabelMap: Record<Scenario, { en: string; zh: string }> = {
  camping: { en: "露营", zh: "\u9732\u8425" },
  creek: { en: "溯溪", zh: "\u6eaf\u6eaa" },
  hiking: { en: "徒步", zh: "\u5f92\u6b65" },
  picnic: { en: "野餐", zh: "\u91ce\u9910" }
};

const difficultyLabelMap: Record<Difficulty, { en: string; zh: string }> = {
  easy: { en: "低难度", zh: "\u4f4e\u96be\u5ea6" },
  moderate: { en: "中难度", zh: "\u4e2d\u96be\u5ea6" },
  hard: { en: "高难度", zh: "\u9ad8\u96be\u5ea6" }
};

const difficultyShortLabelMap: Record<Difficulty, { en: string; zh: string }> = {
  easy: { en: "低", zh: "\u4f4e" },
  moderate: { en: "中", zh: "\u4e2d" },
  hard: { en: "高", zh: "\u9ad8" }
};

const safetyLabelMap: Record<Safety, { en: string; zh: string }> = {
  low_risk: { en: "低风险", zh: "\u4f4e\u98ce\u9669" },
  medium_risk: { en: "中风险", zh: "\u4e2d\u98ce\u9669" },
  high_risk: { en: "高风险", zh: "\u9ad8\u98ce\u9669" }
};

export function destinationName(item: DestinationItem, locale: Locale) {
  return locale === "zh" ? item.nameZh || item.name : item.name;
}

export function destinationCity(item: DestinationItem, locale: Locale) {
  return locale === "zh" ? item.cityZh || toChineseRegionName(item.city) : item.city;
}

export function destinationProvince(item: DestinationItem, locale: Locale) {
  return locale === "zh" ? item.provinceZh || toChineseRegionName(item.province) : item.province || "";
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

export function destinationAgeRange(item: DestinationItem, locale: Locale) {
  const min = item.suitableAgeMin;
  const max = item.suitableAgeMax;
  if (typeof min === "number" && typeof max === "number" && max > min) {
    return locale === "zh" ? `${min}-${max}\u5c81` : `${min}-${max}岁`;
  }
  if (typeof min === "number" && min >= 0) {
    return locale === "zh" ? `${min}\u5c81+` : `${min}岁+`;
  }
  const age = item.minKidAge;
  if (age >= 12) return locale === "zh" ? "12\u5c81+" : "12岁+";
  if (age >= 6) return locale === "zh" ? "6-12\u5c81" : "6-12岁";
  if (age >= 3) return locale === "zh" ? "3-6\u5c81" : "3-6岁";
  return locale === "zh" ? "0-3\u5c81" : "0-3 years";
}

export function destinationAgeLabel(item: DestinationItem, locale: Locale) {
  return locale === "zh" ? `\u9002\u5408\u5e74\u9f84\uff1a${destinationAgeRange(item, locale)}` : `适合年龄：${destinationAgeRange(item, locale)}`;
}

export function destinationFamilyHighlight(item: DestinationItem, locale: Locale) {
  const scenarioText: Record<Scenario, { en: string; zh: string }> = {
    camping: {
      en: "适合亲子轻松露营",
      zh: "\u9002\u5408\u4eb2\u5b50\u8f7b\u677e\u9732\u8425"
    },
    creek: {
      en: "适合带孩子玩水溯溪",
      zh: "\u9002\u5408\u5e26\u5b69\u5b50\u73a9\u6c34\u6eaf\u6eaa"
    },
    hiking: {
      en: "适合亲子轻徒步",
      zh: "\u9002\u5408\u4eb2\u5b50\u8f7b\u5f92\u6b65"
    },
    picnic: {
      en: "适合野餐拍照和放松",
      zh: "\u9002\u5408\u91ce\u9910\u62cd\u7167\u548c\u653e\u677e"
    }
  };

  return locale === "zh" ? scenarioText[item.scenario].zh : scenarioText[item.scenario].en;
}

export function destinationSafetyTip(item: DestinationItem, locale: Locale) {
  const tip: Record<Safety, { en: string; zh: string }> = {
    low_risk: {
      en: "风险较低，仍需留意水边和坡道。",
      zh: "\u98ce\u9669\u8f83\u4f4e\uff0c\u4ecd\u9700\u7559\u610f\u6c34\u8fb9\u548c\u5761\u9053\u3002"
    },
    medium_risk: {
      en: "建议穿防滑鞋，孩子全程在视线内。",
      zh: "\u5efa\u8bae\u7a7f\u9632\u6ed1\u978b\uff0c\u5b69\u5b50\u5168\u7a0b\u5728\u89c6\u7ebf\u5185\u3002"
    },
    high_risk: {
      en: "更适合有经验家庭，雨天不建议前往。",
      zh: "\u66f4\u9002\u5408\u6709\u7ecf\u9a8c\u5bb6\u5ead\uff0c\u96e8\u5929\u4e0d\u5efa\u8bae\u524d\u5f80\u3002"
    }
  };

  return locale === "zh" ? tip[item.safety].zh : tip[item.safety].en;
}

export function destinationDecisionTags(item: DestinationItem, locale: Locale) {
  if (locale === "zh") {
    return [
      destinationAgeRange(item, locale),
      item.hasParking ? "\u53ef\u505c\u8f66" : "\u505c\u8f66\u4e00\u822c",
      item.hasToilet ? "\u6709\u5395\u6240" : "\u5395\u6240\u8f83\u5c11",
      item.difficulty === "easy" ? "\u65b0\u624b\u53cb\u597d" : item.difficulty === "moderate" ? "\u9700\u4e00\u70b9\u4f53\u529b" : "\u9002\u5408\u5927\u5b69\u5b50"
    ];
  }

  return [
    destinationAgeRange(item, locale),
    item.hasParking ? "可停车" : "停车一般",
    item.hasToilet ? "有厕所" : "厕所较少",
    item.difficulty === "easy" ? "新手友好" : item.difficulty === "moderate" ? "需一点体力" : "适合大孩子"
  ];
}

export function destinationTripDuration(item: DestinationItem, locale: Locale) {
  if (item.suggestedDuration?.trim()) return item.suggestedDuration.trim();

  const duration: Record<Scenario, { en: string; zh: string }> = {
    camping: { en: "半日到一日", zh: "\u534a\u65e5\u5230\u4e00\u65e5" },
    creek: { en: "2-4 小时", zh: "2-4 \u5c0f\u65f6" },
    hiking: { en: "2-5 小时", zh: "2-5 \u5c0f\u65f6" },
    picnic: { en: "2-3 小时", zh: "2-3 \u5c0f\u65f6" }
  };

  return locale === "zh" ? duration[item.scenario].zh : duration[item.scenario].en;
}

export function destinationBestFor(item: DestinationItem, locale: Locale) {
  const bestFor: Record<Scenario, { en: string; zh: string }> = {
    camping: { en: "想慢节奏放松的亲子家庭", zh: "\u60f3\u6162\u8282\u594f\u653e\u677e\u7684\u4eb2\u5b50\u5bb6\u5ead" },
    creek: { en: "想玩水、避暑的亲子家庭", zh: "\u60f3\u73a9\u6c34\u3001\u907f\u6691\u7684\u4eb2\u5b50\u5bb6\u5ead" },
    hiking: { en: "想轻量运动的亲子家庭", zh: "\u60f3\u8f7b\u91cf\u8fd0\u52a8\u7684\u4eb2\u5b50\u5bb6\u5ead" },
    picnic: { en: "想野餐、拍照和放风的家庭", zh: "\u60f3\u91ce\u9910\u3001\u62cd\u7167\u548c\u653e\u98ce\u7684\u5bb6\u5ead" }
  };

  return locale === "zh" ? bestFor[item.scenario].zh : bestFor[item.scenario].en;
}

export function destinationPackingList(item: DestinationItem, locale: Locale) {
  const sharedZh = ["\u996e\u7528\u6c34", "\u9632\u6652\u9632\u868a", "\u7eb8\u5dfe\u548c\u5783\u573e\u888b"];
  const sharedEn = ["饮用水", "防晒防蚊", "纸巾和垃圾袋"];

  const scenarioZh: Record<Scenario, string[]> = {
    camping: ["\u91ce\u9910\u57ab\u6216\u9732\u8425\u6905", "\u5929\u5e55\u6216\u906e\u9633\u5e03"],
    creek: ["\u9632\u6ed1\u978b", "\u66ff\u6362\u8863\u7269"],
    hiking: ["\u8f7b\u4fbf\u80cc\u5305", "\u9002\u5408\u8d70\u8def\u7684\u978b"],
    picnic: ["\u91ce\u9910\u57ab", "\u4fbf\u643a\u98df\u7269"]
  };

  const scenarioEn: Record<Scenario, string[]> = {
    camping: ["野餐垫或露营椅", "天幕或遮阳布"],
    creek: ["防滑鞋", "替换衣物"],
    hiking: ["轻便背包", "适合走路的鞋"],
    picnic: ["野餐垫", "便携食物"]
  };

  return locale === "zh" ? [...scenarioZh[item.scenario], ...sharedZh] : [...scenarioEn[item.scenario], ...sharedEn];
}
