# V7.1 Changelog — 成长总结完成版

## Interaction
- Growth 日历日期选择、月份切换、反馈保存全部改为局部刷新并保持 scrollTop。
- 空日期不再 fallback。
- 月份切换清空 selectedDate。
- 最近行动不跳路由，原地选中日期并定位行动区。
- 行动详情改 Bottom Sheet。
- “查看全部行动”与返回均保持 #/growth。
- 只有“和小亲复盘”进入 #/home AI 连续聊天。

## Data
- 每条 action 内聚保存 why/script/observe/status/result/resultText。
- 反馈状态统一为 better/same/worse 语义值。

## UI
- 重排 Growth Hero / 亮点 / 日历 / 当前行动 / 最近行动。
- 按需求统一字号与 Icon Grid。
- 日历仅使用 6px 状态点。
- 删除反馈系统 Emoji，统一自有 SVG。

## Stability
- 调整初始化顺序，首次刷新 #/growth 不再短暂走旧 renderer。
- 回归：65/65 PASS，Page/Console Error 0。
