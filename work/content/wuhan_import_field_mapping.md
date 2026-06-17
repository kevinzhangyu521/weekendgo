# 武汉地点内容导入说明

这份说明用于把 `wuhan_30_places_content_plan.csv` 核对完成后，转换成后台 CSV 批量导入工具需要的 3 个文件：

- `spots.csv`
- `facilities.csv`
- `photos.csv`

## 先不要直接导入内容计划表

`wuhan_30_places_content_plan.csv` 是运营核对表，不是最终导入表。

原因：

- 经纬度必须逐个核对，不能用估算值。
- 图片必须是真实地点图片，不能用 AI 图、占位图、平台截图。
- 某些地点需要确认具体入口，例如八分山、张公堤、府河湿地。

## spots.csv 字段

| 字段 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- |
| external_id | 是 | wuhan-east-lake-greenway | 唯一 ID，建议英文小写短横线 |
| name | 是 | East Lake Greenway | 英文名，没有可用拼音 |
| name_zh | 否 | 东湖绿道 | 中文名 |
| province | 否 | Hubei | 英文省份 |
| province_zh | 否 | 湖北 | 中文省份 |
| city | 是 | Wuhan | 英文城市 |
| city_zh | 否 | 武汉 | 中文城市 |
| lat | 是 | 30.556 | 纬度，必须真实核对 |
| lng | 是 | 114.401 | 经度，必须真实核对 |
| scenario | 是 | picnic | camping / creek / hiking / picnic |
| difficulty | 是 | easy | easy / moderate / hard |
| safety | 是 | low_risk | low_risk / medium_risk / high_risk |
| distance_km | 否 | 0 | 可先填 0，系统会按常住城市展示距离 |
| description | 否 | Good for families... | 英文描述 |
| description_zh | 否 | 适合亲子野餐和散步... | 中文描述 |

## facilities.csv 字段

每个地点可以有多行设施。

| 字段 | 示例 |
| --- | --- |
| spot_external_id | wuhan-east-lake-greenway |
| facility_code | parking |
| facility_name | Parking |
| facility_name_zh | 可停车 |

常用设施：

- `parking` / Parking / 可停车
- `toilet` / Toilet / 有厕所

## photos.csv 字段

每个地点至少建议 1 张封面图。

| 字段 | 示例 |
| --- | --- |
| spot_external_id | wuhan-east-lake-greenway |
| url | https://... |
| caption | Cover |
| caption_zh | 封面图 |
| sort_order | 0 |
| is_cover | true |

图片要求：

- 必须是真实地点图片。
- 没有真实图时，不要填假图。
- 可以先不导入该地点图片，前台会显示默认风景图并标记“待补充”。

## 推荐核对顺序

1. 先核对东湖绿道、木兰草原、清凉寨、木兰天池、后官湖湿地公园。
2. 每个地点先确认导航关键词和经纬度。
3. 再补真实图片。
4. 最后导入后台。

