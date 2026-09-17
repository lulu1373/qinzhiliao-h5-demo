# V9.1 课程入口与侧栏视觉 QA

- source visual truth: `/Users/lulu/.codex/generated_images/01a0ad1e-ffe0-7772-982f-e27fd6f06386/exec-bc6b1e0b-80d9-4df1-8fd1-fe874c514bd2.png`
- implementation screenshots:
  - `/Users/lulu/AIWork/qinzhiliao-h5-demo/qinzhiliao-h5-demo/tests/design-qa-v91/01-sidebar.png`
  - `/Users/lulu/AIWork/qinzhiliao-h5-demo/qinzhiliao-h5-demo/tests/design-qa-v91/02-classroom-top.png`
  - `/Users/lulu/AIWork/qinzhiliao-h5-demo/qinzhiliao-h5-demo/tests/design-qa-v91/04-chat-course.png`
- combined comparison: `/Users/lulu/AIWork/qinzhiliao-h5-demo/qinzhiliao-h5-demo/tests/design-qa-v91/05-reference-comparison.jpg`
- viewport: 390 × 844 CSS px
- density: source 1476 × 1066 px contains three framed concepts; each screen was cropped and normalized to 390 × 844. Implementation captures are 390 × 844 at deviceScaleFactor 1.
- state: signed-in user; open drawer; classroom top; confirmed homework conversation with a matching course recommendation.
- browser evidence: Google Chrome via the repository Playwright harness. Primary drawer, classroom scrolling, course acquisition, back navigation, points check-in and chat recommendation interactions passed. Page errors: none.

## Findings

No actionable P0, P1 or P2 differences remain.

- Fonts and typography: implementation keeps the product's existing Chinese system font stack and reproduces the reference hierarchy. Dense course titles wrap cleanly without clipping.
- Spacing and layout rhythm: the points row is 54 px high; the shared family/member group is about 104 px high. Common tools and recent conversation move into the first viewport as intended. Classroom cards remain readable and the page scrolls to the final real course.
- Colors and visual tokens: cream background, sage green, warm orange and soft semantic icon surfaces match the selected direction and the existing product tokens.
- Image quality and asset fidelity: all seven visible courses use raster covers cropped from the supplied real JianKuai classroom capture, exported at 316 × 180 WebP. No placeholder covers or emoji are used.
- Copy and content: the homepage has no static course entrance. Classroom copy and prices use the supplied real course catalog. The recommendation appears only after a confirmed matching conversation and retains “看看课程 / 先继续聊”.

## Comparison history

The initial automated capture was taken during the drawer/page transition and showed a partial transform. It was rejected as invalid comparison evidence. The implementation was recaptured after a 700 ms settled state; the second capture is the evidence listed above. No implementation fix was required for that capture-only issue.

## Follow-up polish

- P3: the app's existing chat card artifact remains above the course recommendation. This differs from the simplified concept but preserves the current core conversation workflow.
- P3: the classroom category row intentionally scrolls horizontally on 390 px screens, so later categories are partially visible as a discoverability cue.

## Implementation checklist

- [x] Compact single-row points balance and check-in control
- [x] Shared two-row family/member group
- [x] Four-column, two-row common tools aligned to the existing icon system
- [x] Real JianKuai course list and prices
- [x] Vertically scrollable classroom
- [x] Contextual in-chat course recommendation
- [x] No static course entry on the homepage
- [x] Browser interaction and console verification

final result: passed
