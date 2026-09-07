# V3.5 侧栏统一滚动：测试报告

## 测试边界

本轮针对用户批准的侧栏改版执行。环境为 Chromium headless；H5 standalone 通过 `set_content` 挂载。触摸由 Chrome DevTools Protocol 的 `Input.dispatchTouchEvent` 发送，真实走浏览器原生滚动，不用手写 scrollTop 模拟触摸结果。

这不是 iPhone/Android 实机验收，不代表在用户的 ChatGPT 预览器或微信 WebView 内进行了直接测试。没有真实短信、支付、云端服务或 GitHub 发布。

## 测量（390 × 675px，安全区为0）

| 区域 | V3.4 | V3.5 |
|---|---:|---:|
| 顶部固定高度 | 409px | 76px |
| 底部固定高度 | 66px | 0px |
| 可滚动内容视窗 | 200px | 599px |

可滚动内容由仅历史列表改为会员、功能、历史与客服的统一内容流。内容少、屏幕足够高时不制造无意义滚动空间。

## 本轮结果

| 测试组 | 结果 | 证据 |
|---|---|---|
| 侧栏滚动、手势与来源恢复 | 18 项通过 | `v35/drawer-scroll-audit.json` |
| 视口布局 | 9 组通过 | 同上 viewports |
| 原有任务/消息计数与业务链 | 19 项通过 | `navigation-centers-v35.json` |
| 二、三级返回按钮 | 27 / 27 通过 | `back_button_audit_v35.json` |
| 关闭后白边 | 几何检查通过；闭合态与强制移除抽屉整屏像素差异为0 | `v35/layout-measurements.json`、closed截图 |
| 页面运行错误 | 0 | 各组 JSON |

9组宽高：320×568、360×640、375×667、390×675、390×844、430×932、517×675、768×675、390×425。

## 重点行为

- 从会员条、服务入口、历史记录上起手，统一滚动，头部保持固定。
- 向下滑能回到上部；轻斜向上滑不收起；滚轮同样有效。
- 滚到底不带动背景首页；客服始终可达。
- 左向横滑关闭、左缘打开、短拖回收保留。
- 内页打开时抽屉真正隐藏；返回来源恢复展开和原scrollTop。
- 家庭档案、测评、指南、会员、任务、消息、账号和设置入口可用。
- 指南分类/文章、设置/账号等多层返回不被提前拦截。
- 首页未发送草稿和浏览位置保留。
- 任务角标仍为待办，消息角标仍为未读；读消息不完成任务。
- 原对话→三阶段正面解读→行动卡链路通过回归。
- 模拟顶部47px和底部34px安全区、减少动态效果设置、快速开合通过。

## 可复现命令

```bash
python scripts/build_standalone.py
node --check app.js
python tests/drawer_scroll_v35.py
python tests/navigation_centers_v35.py
python tests/back_button_audit_v35.py
```

截图与几何对比脚本 `tests/capture_drawer_v35.py` 可选传入 V3.4 standalone 路径。早期测试脚本/报告保留为历史记录，它们可能仍假设“返回后抽屉保持关闭”；V3.5采用本报告中的新版脚本。

## 状态说明

`navigation_centers_v35.py` 的旧版本数据迁移分支使用明确的测试专用 Storage adapter，验证数据迁移与重新挂载；不将其表述为实机localStorage刷新测试。此次不会清空已有业务数据。完整源码为前端Demo，已有非本轮功能仍按此前Mock方式运行。
