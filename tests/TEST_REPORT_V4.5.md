# 亲智聊 H5 Demo V4.5 测试报告

## 本轮目标
移动端可读性与质感升级，不改变 V4.4 的业务流程、侧栏 IA、连续聊天、PageStack 和会员逻辑。

## 真机尺度基准（390 × 844，iPhone Safari UA）
- 页面标题：`亲智聊`
- `html` 运行类：`mobile-runtime`
- Demo 假状态栏：隐藏
- 顶部品牌名：20px
- 顶部副标题：13px
- 首页 Hero：32px / 40px
- Hero 副标题：17px / 26px
- 快捷问题：15px，48px 高
- Section Title：20px
- 成长卡主标题：18px
- 成长卡说明：14px
- 输入框：16px，48px 内容高度
- AI 对话正文：17px
- 推荐选项：15px，42px 高
- 侧栏昵称：20px
- 侧栏身份：14px
- 侧栏功能：16px
- 最近对话标题：17px
- 最近对话摘要：14px

## 响应式 / 路由检查
检查宽度：360 / 390 / 430px。

每个宽度检查：
- Home
- Drawer
- Growth
- Assessments
- Membership
- Profile
- Settings

合计：21 / 21 无横向溢出。

## 错误
- Page Error：0
- Console Error：0
- JavaScript syntax：通过 `node --check`

## 说明
- 真实移动 UA 下隐藏 H5 自绘的 9:41 / Wi-Fi 状态栏。
- 桌面原型预览仍保留假状态栏，方便产品截图。
- 输入字号固定为 16px，避免真机阅读和输入体验过小。
- 360px 小屏通过压缩间距适配，不再把正文缩到 10/11px。
- V4.4 会员香槟 / 深可可状态保留。
