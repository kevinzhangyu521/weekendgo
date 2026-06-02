import type { DestinationItem } from "./types";

export const destinationMockData: DestinationItem[] = [
  {
    id: "d1",
    name: "Qingxi Family Creek",
    nameZh: "青溪谷亲子浅滩",
    city: "Shanghai",
    cityZh: "上海",
    latitude: 31.307,
    longitude: 121.612,
    scenario: "creek",
    distanceKm: 42,
    difficulty: "easy",
    safety: "low_risk",
    rating: 4.8,
    hasParking: true,
    hasToilet: true,
    minKidAge: 3,
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80",
    description: "Shallow water sections with easy family access and solid weekend facilities.",
    descriptionZh: "浅滩区域多，亲子可达性高，周末配套设施完善。"
  },
  {
    id: "d2",
    name: "Pine Lake Campground",
    nameZh: "松林湖畔营地",
    city: "Shanghai",
    cityZh: "上海",
    latitude: 31.145,
    longitude: 121.216,
    scenario: "camping",
    distanceKm: 68,
    difficulty: "easy",
    safety: "low_risk",
    rating: 4.7,
    hasParking: true,
    hasToilet: true,
    minKidAge: 2,
    image:
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1400&q=80",
    description: "Flat campsites and beginner-friendly layout, great for first-time family camping.",
    descriptionZh: "营位平整、分区清晰，非常适合新手家庭第一次露营。"
  },
  {
    id: "d3",
    name: "Yunlan Light Trail Loop",
    nameZh: "云岚山轻徒步环线",
    city: "Shanghai",
    cityZh: "上海",
    latitude: 31.251,
    longitude: 121.442,
    scenario: "hiking",
    distanceKm: 36,
    difficulty: "moderate",
    safety: "medium_risk",
    rating: 4.6,
    hasParking: true,
    hasToilet: false,
    minKidAge: 6,
    image:
      "https://images.unsplash.com/photo-1464822759844-d150ad6d1d88?auto=format&fit=crop&w=1400&q=80",
    description: "A shaded two-hour loop suitable for active families with school-age children.",
    descriptionZh: "约2小时林荫环线，适合有学龄儿童的活力家庭。"
  },
  {
    id: "d4",
    name: "Begonia Bay Picnic Lawn",
    nameZh: "海棠湾野餐草坪",
    city: "Shanghai",
    cityZh: "上海",
    latitude: 31.223,
    longitude: 121.531,
    scenario: "picnic",
    distanceKm: 18,
    difficulty: "easy",
    safety: "low_risk",
    rating: 4.5,
    hasParking: false,
    hasToilet: true,
    minKidAge: 0,
    image:
      "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1400&q=80",
    description: "Wide lawn for picnic play with stroller-friendly paths and open family space.",
    descriptionZh: "大草坪适合野餐玩耍，婴儿车可通行，家庭活动空间充足。"
  }
];
