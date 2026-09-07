# 亲智聊 H5 Demo V7.1 — 成长总结重构测试报告

- **版本**：V7.1
- **测试引擎**：Chromium via Playwright
- **测试视口**：390x844
- **执行结果**：**65/65 PASS**
- **Page Error / Console Error**：**0**
- **结论**：成长总结单路由局部交互重构通过本轮完整回归。

## 1. 本轮重构范围

本轮从已经开始 growth 局部更新的 V7.0 基线继续，不回退 V6.9。主要完成：

1. `#/growth` 内周 / 月 / 全部、月份切换、日期选择、当前行动、最近行动、反馈、行动详情统一为局部交互。
2. 日期点击、月份切换、反馈保存不再调用整页 `renderRoute()`，并保持当前 `scrollTop`。
3. 空日期显示真实空状态；跨月时清空 `selectedDate`，不再残留旧月份行动。
4. 最近行动点击只选中对应日期并定位当前行动区，不跳独立详情路由。
5. 行动详情改为 Bottom Sheet，仍停留在 `#/growth`。
6. 每条行动独立保存 `why / script / observe / status / result / resultText`，取消详情内容串用。
7. 反馈状态使用 `better / same / worse` 语义值与自有 SVG，不再使用系统 Emoji。
8. 成长总结重新排版并按指定字号、Icon Grid、6px 日历状态点统一视觉规格。
9. 修复 V7.0 首次刷新时旧 renderer 可能先执行的问题，确保直接进入 `#/growth` 就渲染新版本。

## 2. 字体与图标实测

### 字号

| 项目 | 实测 |
|---|---:|
| 页面标题 | 22px |
| Hero 主标题 | 25px |
| Hero 正文 | 15px |
| Section Title | 20px |
| 本周亮点标题 | 16px |
| 本周亮点说明 | 14px |
| 月份 | 17px |
| 星期 | 12px |
| 日期 | 14px |
| 行动标题 | 16px |
| 来源 / 日期 | 13px |
| 状态标签 | 13px |
| 按钮 | 15px |

扫描结果：成长总结可见文本最小字号 **12px**，不存在 10 / 10.5 / 11px 正文。

### Icon Grid

| 项目 | 实测 |
|---|---|
| Hero | [44, 44] / SVG [24, 24] |
| 本周亮点 | [40, 40] / SVG [22, 22] |
| 当前行动 | [40, 40] / SVG [22, 22] |
| 最近行动 | 32×32 / SVG [18, 18] |
| Calendar SVG 数量 | 0 |
| Calendar 状态点 | 6×6px |
| Feedback | 40×40 / SVG 22×22 |

## 3. 指定真实回归结果

| 操作 | 结果 | 关键验证 |
|---|---|---|
| 8 月 17 日 | PASS | `#/growth`；scroll delta 0；匹配“睡前先听孩子说完，再回应” |
| 8 月 23 日 | PASS | `#/growth`；scroll delta 0；匹配“手机问题先不急着讲道理” |
| 8 月 26 日 | PASS | `#/growth`；scroll delta 0；匹配“写作业时先减少一次催促” |
| 空日期 8 月 25 日 | PASS | 真空状态；不 fallback 到任何其他行动 |
| 切到 7 月 | PASS | `selectedDate` 清空；不跳页、不跳顶部 |
| 再切回 8 月 | PASS | 不保留旧选中行动 |
| 最近行动第一条 | PASS | 原地定位当前行动区；不跳路由 |
| 最近行动第二条 | PASS | 原地定位当前行动区；不跳路由 |
| 还没试 | PASS | 原地保持待尝试；scroll 不变 |
| 试过了 → 顺一点 | PASS | 原地更新状态点 / 当前行动 / 最近行动 / 统计 |
| 试过了 → 没变化 | PASS | 原地更新；状态点 `same` |
| 试过了 → 更糟 | PASS | 原地更新；状态点 `worse` |
| 行动详情 Bottom Sheet | PASS | 不离开 `#/growth`；内容属于当前行动 |
| 关闭 Sheet | PASS | scrollTop 保持 |
| 查看全部行动 | PASS | 仍在 `#/growth`；显示 3 条行动 |
| 返回 | PASS | Growth 内局部返回周视图 |
| 和小亲复盘 | PASS | 唯一回到 `#/home` AI 连续聊天的动作 |

## 4. 行动详情串用专项验证

三条行动分别打开 Bottom Sheet，并验证独立内容：

- **8 月 17 日 / 睡前先听孩子说完，再回应**：话术为“你先说完，我暂时不急着给建议。”
- **8 月 23 日 / 手机问题先不急着讲道理**：话术为“我们先不讨论玩多久，我想先听听你为什么还不想停。”
- **8 月 26 日 / 写作业时先减少一次催促**：话术为“你是还没准备好，还是不知道先从哪里开始？”

三条均 PASS，没有出现“手机问题显示写作业话术”等串数据问题。

## 5. 错误与稳定性

- `Page Error`: **0**
- `Console Error`: **0**
- 源码中的系统反馈 Emoji `🙂 / 😐 / 🙁`: **0**
- 首次进入 `#/growth`: **直接渲染 V7.1 新布局**
- 全套自动化断言：**65/65 PASS**

## 6. 测试方式说明

使用真实 Chromium + Playwright，在 390×844 手机视口中执行真实 DOM 点击、滚动与 Bottom Sheet 交互，并采集 URL、scrollTop、可见内容、computed style、DOM icon 尺寸以及 Page/Console Error。由于当前执行环境禁止浏览器导航到 localhost/file URL，测试以 V7.1 **完全相同的 HTML 字节**注入真实 Chromium 文档执行；交互、DOM、CSS 与 JavaScript 均由浏览器真实运行，不是静态文本检查。
