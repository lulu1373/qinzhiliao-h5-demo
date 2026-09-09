# 亲智聊 H5 Demo

当前运行入口：`index.html`，与 `latest/index.html` 同步。线上地址：https://lulu1373.github.io/qinzhiliao-h5-demo/latest/

## 成长报告更新（V9.0 基础）

侧栏「成长总结」进入 `#/growth`，现在提供日、周、月报告，行动日历和列表收进右上角「行动记录」。支持方法详情、来源核对、课题校正、反馈保存，以及携带报告上下文回到现有对话，保留未发送的草稿。

首次默认查看本周个人记录；示例报告使用独立的 2026 年 8 月数据。示例反馈不会修改个人行动。新对话按本地日期保存回顾片段；没有日期的旧对话不补编日期。报告和校正保存在当前浏览器，不会自动写入家庭档案。没有情绪数据时显示空态，不把行动结果转换为情绪评分。

成长报告模型、视图和样式在 `assets/growth-report-*` 中维护，控制器由构建工具放入现有 H5 内部环境。修改后运行：

```sh
python3 tools/build_growth_reports.py
node --test --experimental-test-coverage tests/growth-report-model.test.cjs tests/growth-report-view.test.cjs
python3 tests/growth_report_e2e.py
```

浏览器测试依赖 Python Playwright 与已安装的 Google Chrome，使用隔离的临时浏览器数据。构建同步根入口、`latest/` 入口和所需资源，不改变版本归档。

## 成长记录：里程碑

首页「成长记录」内新增「成长回顾 / 里程碑」切换。里程碑支持手动记录，或从回顾的对话依据、已有反馈的行动详情中选择「记为里程碑」。标题、发生日期、分类、家庭成员、经过和意义由用户填写或核对，点击「确认留下」后才保存。列表按事件日期倒序，周／月回顾最多展示本期两条；补记不按保存时间误归期。

四种分类为看见自己、尝试改变、重新靠近、其他。保存时绑定本地家庭标识及成员 ID；同一来源不会重复创建。来源变化仅提示核对，保留确认时的文字；清除对话会清理来源摘录及仍引用原文的预填部分，保留独立补充，撤销缓冲同样清理。移除里程碑不删除来源，可在当前页面会话撤销；刷新或重置后撤销入口结束。示例里程碑独立存储，不能进入个人时间线或报告。

数据仍保存在当前浏览器中；本版未接入云同步、AI 自动生成里程碑或公开分享。请勿把示例视为真实的成长判断。

里程碑模块维护在 `assets/growth-milestone-*`，与成长报告共用构建工具。完整相关验证：

```sh
python3 tools/build_growth_reports.py
node --test --experimental-test-coverage tests/growth-report-model.test.cjs tests/growth-report-view.test.cjs tests/growth-milestone-model.test.cjs tests/growth-milestone-view.test.cjs
python3 tests/growth_milestone_e2e.py MilestoneTests
python3 tests/growth_report_e2e.py
```

## 历史版本 V7.2

本版在 V7.1 成长总结完成版基础上，新增首页右上角「…」悬浮快捷菜单，视觉和交互参考用户提供的阿福截图。

测试：`tests/regression_v72_more.py`
测试结果：`tests/regression_v72_more.json`
回归截图：`tests/01-home-more-menu.png`

## V7.3
本版本在 V7.2 基础上增加正文可读性 P0 Patch。只放大真实阅读正文；日期、来源、状态、标签、时间戳等元信息保持紧凑，避免破坏现有布局。
