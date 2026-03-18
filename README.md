# claude-inspect

DevTools for Claude Code. Point at a UI element, and Claude understands the component, its props, and where the source lives.

## Why

You're debugging a frontend issue with Claude. To give it context, you open Chrome DevTools, copy the element, find the component name, look up the source file, paste it all into chat. Every time.

**claude-inspect removes that loop.** It gives Claude direct access to what DevTools shows you — elements, components, console, network, performance — so you can just point and talk.

## How it works

```
/claude-inspect:inspect http://localhost:3000
```

1. A browser opens. Every element on the page becomes hoverable — a blue overlay follows your cursor, and a tooltip shows the component name, props, source file, and styles in real-time
2. See something you want Claude to look at? Click **"→ Claude Code"** on the tooltip
3. `[Component #1: <Header>]` appears in your Claude Code chat with full context — component hierarchy, props, source path with line number, computed styles
4. Ask Claude what you need: *"이 컴포넌트 왜 오른쪽으로 밀려있지?"*, *"이 버튼에 loading state 추가해줘"*

Point at the problem, talk about it. Claude already knows the component, the file, and the props.

You can also ask in natural language:

```
Check the console errors and failed network requests on localhost:3000
```

```
Take a screenshot of the current page
```

## Example

```
/claude-inspect:inspect http://localhost:3000
```

> 사이드바의 네비게이션 메뉴를 클릭 → "→ Claude Code"

```
[Component #1: <SideNav>] — src/components/SideNav.tsx:24
```

> "이 컴포넌트에 active 상태 표시가 안 돼. 현재 라우트에 맞게 하이라이트 해줘"

Claude reads the selection file, opens `src/components/SideNav.tsx`, and makes the fix — knowing the exact component, its props (`items`, `currentPath`), and where it lives.

## Installation

```bash
/plugin marketplace add tnsqjahong/claude-inspect
/plugin install claude-inspect
```

## Features

### Inspect

Hover over any element to see its component hierarchy, props, source file with line numbers, computed styles, and bounding rect. One click sends everything to Claude.

### Monitor

Console logs, network requests (with failure filtering), and Core Web Vitals (LCP, FCP, CLS, INP) — all collected in real-time and readable by Claude.

### Detect

Automatically recognizes React, Vue 3, and Svelte components. Extracts component names, props, and maps them back to source files in your project.

| Framework | Component Name | Props | Source File |
|-----------|:-:|:-:|:-:|
| React (dev mode) | ✓ | ✓ | ✓ |
| Vue 3 | ✓ | ✓ | ✓ |
| Svelte | ✓ | — | — |

### Capture

Screenshots (viewport or full-page) saved as files that Claude can read and analyze.

### Headless

Run all monitoring in the background without opening a browser window. Useful for CI or automated debugging workflows.

## CLI Reference

| Command | Description |
|---------|-------------|
| `launch <url> [--headless]` | Open browser |
| `navigate <url>` | Go to URL |
| `screenshot [--fullpage]` | Capture screenshot |
| `inspect <selector>` | Inspect element by CSS selector |
| `select start / wait / stop` | Visual element selection |
| `logs [--type=error\|warn\|all]` | Console logs |
| `network [--failed]` | Network requests |
| `perf` | Core Web Vitals |
| `components [--selector=<sel>]` | Component tree |
| `find-component <name>` | Find source file |
| `status` | Check daemon status |
| `close` | Close browser |

All output is saved under `.claude-inspect/` for Claude to read via the Read tool.

## License

MIT
