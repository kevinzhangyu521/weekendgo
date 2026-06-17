# CSV 导入模板使用说明

这个文件夹里有后台批量导入工具需要的 3 个 CSV 模板：

- `spots.csv`
- `facilities.csv`
- `photos.csv`

## 重要提醒

模板里的 `待核对` 和 `https://example.com/...` 只是占位示例，不能直接导入。

导入前必须替换为：

- 真实纬度
- 真实经度
- 真实图片 URL

## 导入前检查

1. `lat` 必须是数字，例如 `30.556`
2. `lng` 必须是数字，例如 `114.401`
3. `scenario` 只能是：
   - `camping`
   - `creek`
   - `hiking`
   - `picnic`
4. `difficulty` 只能是：
   - `easy`
   - `moderate`
   - `hard`
5. `safety` 只能是：
   - `low_risk`
   - `medium_risk`
   - `high_risk`
6. 图片 URL 必须是 `http://` 或 `https://` 开头。
7. 没有真实图片时，不要填假图片。

