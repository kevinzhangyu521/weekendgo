const zhRegionAliases: Record<string, string> = {
  Hubei: "\u6e56\u5317",
  Wuhan: "\u6b66\u6c49",
  "Wuhan Huangpi": "\u6b66\u6c49\u9ec4\u9642",
  Huangpi: "\u6b66\u6c49\u9ec4\u9642",
  "Wuhan Caidian": "\u6b66\u6c49\u8521\u7538",
  Caidian: "\u6b66\u6c49\u8521\u7538",
  "Wuhan Hongshan": "\u6b66\u6c49\u6d2a\u5c71",
  Hongshan: "\u6b66\u6c49\u6d2a\u5c71",
  "Wuhan Wuchang": "\u6b66\u6c49\u6b66\u660c",
  Wuchang: "\u6b66\u6c49\u6b66\u660c",
  "Wuhan Dongxihu": "\u6b66\u6c49\u4e1c\u897f\u6e56",
  Dongxihu: "\u6b66\u6c49\u4e1c\u897f\u6e56",
  Xiaogan: "\u5b5d\u611f",
  Huanggang: "\u9ec4\u5188",
  Xianning: "\u54b8\u5b81",
  Ezhou: "\u9102\u5dde",
  Jingmen: "\u8346\u95e8",
  Yichang: "\u5b9c\u660c",
  Suizhou: "\u968f\u5dde",
  Jiangxi: "\u6c5f\u897f",
  Jiujiang: "\u4e5d\u6c5f",
  Anhui: "\u5b89\u5fbd",
  Shanghai: "\u4e0a\u6d77",
  Beijing: "\u5317\u4eac",
  Zhejiang: "\u6d59\u6c5f",
  Hangzhou: "\u676d\u5dde",
  Sichuan: "\u56db\u5ddd",
  Chengdu: "\u6210\u90fd",
  Guangdong: "\u5e7f\u4e1c",
  Guangzhou: "\u5e7f\u5dde",
  Shenzhen: "\u6df1\u5733"
};

export function toChineseRegionName(value: string | null | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  return zhRegionAliases[trimmed] ?? trimmed;
}
