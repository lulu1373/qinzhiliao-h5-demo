# Icon System V3 Audit

## Purpose
Unify the H5 icon language after several historical systems accumulated in parallel.

Current scan (root index + assets):
- legacy `svg.*` references: 422
- App Feature V3: 18
- Settings soft-3D: 3
- Membership benefit art: 5
- Points V3 art: 22
- older qzl-soft3d: 41
- older qzl-ref-icon: 22
- older qzl-ip/IconPark: 30
- older biz-svg: 32

The legacy-reference count is not the defect count. Many references are navigation utilities and should remain line icons.

## Root causes
1. Multiple asset families were mixed in the same screen: old line SVG, IconPark-style two-tone, custom soft-3D, emoji-like art and fixed-color business SVG.
2. Pixel dimensions were sometimes equal while optical size was not; large silhouettes and fine-line glyphs looked 20–40% different in visual weight.
3. Container geometry drifted between 36/40/44/48/52/56 px with different radii and shadows.
4. Saturation and lighting direction were inconsistent.
5. Global rules such as `.list-row-icon svg`, `.v6-tool-orbit svg` and currentColor coercion could unintentionally restyle fixed-color artwork.
6. Feature illustrations and utility controls were treated as the same category.

## V3 hierarchy

### A. Feature icons — soft 3D
Use for product destinations, modules, rewards and content categories.
- 64×64 source viewBox
- pastel 2–3 stop gradient
- upper-left highlight
- subtle lower-right shadow
- no emoji
- no currentColor dependency
- optical fill target: 68–76%

Drawer sizes:
- Common tools: 52 px plate / 44 px artwork
- Primary drawer rows: 48 px plate / 40 px artwork
- Compact footer feature: 36 px plate / 30 px artwork

### B. Semantic mini-icons — colored/two-tone
Use inside dense secondary lists and status cards.
- 28–36 px plate
- 22–30 px artwork
- minimal shadow

### C. Utility icons — neutral monoline
Keep line icons for:
- back
- close
- chevrons
- search
- copy
- share
- like
- refresh
- check
- microphone
- send
- camera

Rules:
- 16–24 px
- 1.7–2.0 px stroke
- neutral gray/currentColor
- no feature-style 3D shadow

A back arrow should not look like a product feature icon.

## Phase 1 — completed
Migrated to `QZLIconSystemV3`:
- 简快课堂
- 我的学习
- 我的测评
- 家长社区
- 成长总结
- 百宝箱
- 任务中心
- 消息通知
- 家庭档案
- 会员权益
- 帮助与反馈

Also:
- drawer 成长积分 uses the Points V3 medal art
- all eight common tools share one optical plate scale
- source differences no longer affect drawer presentation

## Already standardized elsewhere
- Settings main navigation: `QZLSettingsIconsV2`
- Membership benefits: `QZLMemberBenefitIcons`
- Growth points: `QZLPointsV3Icons`

## Remaining migration plan

### P1 — high visibility
- Home starter/action cards: child / conflict / communication / homework
- Growth surfaces: sprout / growthLeaf / relation / conflict / communication
- Assessment list/report feature icons
- Guide category cards and guide hero icons
- Archive overview / relationship / memory feature tiles
- Messages and task-center category icons

### P2 — secondary feature lists
- Privacy center: family / brain / export-data rows
- Help-center question category art
- About-page semantic rows
- Assessment report insight and saved-result cards
- Course reward/member strips outside the drawer

### Keep as utility icons
Do not migrate these to soft-3D:
- back
- close
- search
- check
- copy
- share
- like/heart when used as an action
- repeat/refresh
- mic
- send
- camera
- chevrons

## Engineering guardrails
1. New product-destination icons must come from a named component family, not raw `svg.*` strings.
2. Fixed-color art must not depend on currentColor.
3. Feature artwork classes must be scoped so generic SVG rules cannot recolor them.
4. Every new family needs unit tests for declared names, gradient/shadow presence, and unique SVG IDs.
5. High-traffic screens need browser checks for icon count, optical plate dimensions, overflow and runtime JS errors.
