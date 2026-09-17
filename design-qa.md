# V10 侧栏自适应设计 QA

## Evidence

- Source visual truth: `/var/folders/j4/qkh28ctj2dq4d9rf5m1908kh0000gp/T/codex-clipboard-10309b76-aa36-4fff-9698-75806eb15084.png`
- Source pixels: 1020 × 2040；包含浏览器框架，作为问题状态证据使用。
- Mobile implementation: `/Users/lulu/AIWork/qinzhiliao-h5-demo/qinzhiliao-h5-demo/tests/design-qa-v10/mobile-final-390x844.png`
- Wide implementation: `/Users/lulu/AIWork/qinzhiliao-h5-demo/qinzhiliao-h5-demo/tests/design-qa-v10/wide-final-1024x768.png`
- Full comparison: `/Users/lulu/AIWork/qinzhiliao-h5-demo/qinzhiliao-h5-demo/tests/design-qa-v10/source-vs-wide-final.jpg`
- CSS viewports: 390 × 844 and 1024 × 768；implementation device scale factor 1。
- Density normalization: comparison keeps implementation at 1024 × 768 and scales the 1020 × 2040 source capture proportionally to 384 × 768. Browser chrome and differing aspect ratio are treated as context, not fidelity defects.
- State: logged-in home, daily check-in sheet dismissed, drawer fully open, recent conversations collapsed to one row.

## Full-view comparison

The source shows a partial-width drawer, exposed app content and an internal white strip on the right. The final implementation covers the complete app canvas with one continuous background. On wide screens, header, points, feature rows, tools, recent conversation and footer use a centered 600 px reading width; the drawer itself remains full width, so there is no one-sided blank edge.

On the 390 × 844 capture, the same structure uses the available width without horizontal overflow. The fixed help footer stays at the screen bottom while the middle region remains scrollable.

## Focused comparison

The mobile implementation capture is the focused evidence because text and icons are fully readable there. It confirms:

- the eight existing product icons remain aligned in a 4 × 2 grid;
- recent conversation contains mascot avatar, title, summary, time and enter affordance;
- family archive and membership share one compact two-row group;
- help and feedback is separated from scroll content by a fixed footer divider.

## Required fidelity surfaces

- Fonts and typography: existing system and PingFang stack preserved. Headings, labels and secondary text retain the product hierarchy without new wrapping at 320–430 px.
- Spacing and layout rhythm: full-width drawer and fixed three-zone structure pass. All main wide-screen content blocks align to the same 600 px width. Mobile horizontal padding is 10–14 px.
- Colors and tokens: warm paper canvas, green archive, gold membership and existing tool colors are preserved. No new competing palette was introduced.
- Image quality and assets: existing user avatar, mascot avatar and existing product icon assets are reused. No placeholder or generated replacement is present.
- Copy and content: “最近对话”“查看全部”“帮助与反馈” and all eight common-tool labels match the product IA. Active conversations derive title, summary and time from current chat messages; fallback Demo history remains available.

## Interaction and runtime checks

- `查看全部` expands from 1 to 7 rows and `收起` returns to 1 row.
- Opening a historical conversation preserves its title when the drawer is reopened.
- HTML entities in user messages are decoded before the recent-conversation preview is escaped for output.
- Menu click and edge-swipe opening both move focus to Close and make the covered main viewport inert; close restores focus to the opener.
- Replacing an opened historical conversation through the voice flow clears its historical identity and derives a fresh current title.
- Help footer remains reachable at 320 × 568 after the scroll region reaches its bottom.
- Drawer close control remains a 44 × 44 px target.
- In-app browser console errors: none.
- Automated viewports: 320 × 568, 360 × 800, 390 × 844, 430 × 932, 480 × 900 and 1024 × 768.

## Comparison history

1. Pass 1 found a P2 wide-screen rhythm defect: the 4 × 2 tool grid stretched across the full 1024–1280 px canvas. Fixed by keeping the drawer background full width and centering interactive content at a 600 px maximum reading width.
2. Pass 2 found a P2 alignment defect: the points card retained a left-zero margin while later sections were centered. Fixed with an explicit centered margin rule for `.course-points-summary`.
3. Pass 3 confirmed all main blocks share the same x-position and 600 px width in the wide browser.
4. Code review found focus isolation, historical-conversation identity and entity-decoding defects. A second pass added edge-swipe focus handling and cleared historical identity when voice input replaces a conversation. All findings were fixed and covered by E2E regression tests; final review found no remaining P0/P1/P2.

## Findings

No actionable P0, P1 or P2 visual, interaction or accessibility mismatch remains for the approved drawer repair scope.

## Follow-up polish

- P3: production conversation history should eventually use server timestamps rather than the Demo fallback labels for archived conversations.

final result: passed
