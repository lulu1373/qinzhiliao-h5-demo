# V3.4 入口去重与计数联动专项验收

## 改动基线与范围

基于当前对话提供的 V3.3 压缩包；不读取其他对话的开发分支，不推送或修改 GitHub。

- 删除首页顶部礼物／任务入口。
- 删除首页与聊天共用「更多」菜单中的消息入口。
- 任务中心与消息中心的常规导航入口统一保留在侧栏。
- Demo 工具页保留调试跳转；它不是普通产品导航入口。
- 任务计数由未完成行动与进行中测评派生；同一行动不再因“待尝试”和“待反馈”重复计数。
- 消息维护逐条已读状态；查看、重复查看、全部已读均不改变任务完成状态。
- 点击消息进入已有行动反馈、周总结、测评详情或报告；已完成事项不因旧提醒被再次创建。
- 为保证测评待办一致，记录每份测评进度与完成状态；确认暂退时调用现有父级返回机制，清理已退出的答题路径。

默认演示数据有 2 项待办（1 个行动＋1 份测评）、2 条未读消息。数字不是预设必须显示的值，会随本地状态变化。进行中的计划卡仍是既有演示概览，不重复计作一条待办。

## 实际执行结果

| 验证 | 结果 | 原始记录 |
|---|---:|---|
| 入口、角标、消息跳转、测评进度、迁移专项 | 19/19 | navigation-centers-v34.json |
| 二／三级页面返回 | 27/27 | back_button_audit_v34.json |
| 抽屉边缘、拖动、尺寸变化、快速开关 | 31/31 | drawer-v34/result.json |
| 原有核心流程检查点 | 8/8 | core-smoke-v34.json |

各测试记录中未捕获 Page Error；入口专项与抽屉专项亦未捕获 Console Error。抽屉正常关闭截图与强制移除抽屉图层后的截图逐像素一致。

## 保留性检查

路由栈函数、抽屉几何和手势代码与 V3.3 逐字一致；原 CSS 保持完整，仅追加消息按钮的局部样式；所有品牌／角色资产逐文件字节一致。详情见 `scope-preservation-v34.json`。

## 验证边界

这是 Chromium 无头浏览器测试，不是 iOS、Android 或微信真机验证。
本环境限制 URL 导航，交互测试通过 `set_content` 装载完整独立 HTML，覆盖存储不可用时的内存回退；旧数据迁移和状态重载使用仅在测试中注入的 Storage stub，未冒充真实 HTTP/file:// 刷新测试。
AI、短信、支付和通知均沿用现有 Demo，未连接真实服务。本轮没有重写所有页面，也未声称全 App 已逐页实机验收。

## 重跑

```bash
python scripts/build_standalone.py
node --check app.js
python tests/navigation_centers_v34.py
python tests/core_smoke_v34.py
python tests/drawer_boundary_v34.py
python tests/back_button_audit_v34.py
```

测试需要 Python Playwright 与 Chromium（脚本默认 `/usr/bin/chromium`，其他系统按实际路径调整）。
