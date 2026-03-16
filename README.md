# claude-browser

Claude Code MCP server for frontend development. Launch a browser, visually inspect elements, detect React/Vue/Svelte components, and monitor console/network/performance — all from your terminal.

## What it does

- **Visual element selection** — Hover over any element to see its component name, props, source file, and styles
- **"→ Claude Code" button** — Click to auto-type `[Component #N]` into your Claude Code chat. Full component info is saved to a file that Claude reads automatically
- **Component detection** — React, Vue 3, Svelte components with props and source file mapping
- **Browser monitoring** — Console logs, network requests, Core Web Vitals (LCP, FCP, CLS, INP)
- **Screenshots** — Capture page state for visual debugging
- **Headless mode** — Claude can autonomously monitor your app in the background

## Installation

```bash
npm install claude-browser
```

That's it. `postinstall` automatically:
1. Installs Playwright Chromium
2. Adds `claude-browser` to your project's `.mcp.json`

Restart Claude Code or run `/mcp` to connect.

### Manual setup (if needed)

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "claude-browser": {
      "command": "node",
      "args": ["node_modules/claude-browser/dist/index.js"]
    }
  }
}
```

## Usage

### Quick start

```
/claude-browser:inspect http://localhost:3000
```

This launches the browser and enables element selection mode.

### Element selection workflow

1. Hover over elements to see component info in a tooltip
2. Click **"→ Claude Code"** button on the tooltip
3. `[Component #1: <Header>]` is auto-typed into your chat
4. Compose your message: `[Component #1: <Header>] 이거를 [Component #2: <Card>] 안으로 옮겨줘`
5. Claude reads the full component details from `.claude-browser/selections/`

### Natural language

```
Launch the browser at http://localhost:3000 and take a screenshot
```

```
Check the console errors and failed network requests on localhost:3000
```

```
Open localhost:3000, inspect the component tree, and find the source file for DashboardCard
```

## Available Tools

### Browser Control

| Tool | Description |
|------|-------------|
| `browser_launch` | Launch Chromium and optionally navigate to a URL |
| `browser_navigate` | Navigate to a new URL |
| `browser_screenshot` | Capture a screenshot |
| `browser_close` | Close the browser |

### Element Inspection

| Tool | Description |
|------|-------------|
| `start_element_selection` | Enable visual selection overlay with hover tooltips |
| `get_selected_element` | Get details of the element selected via "→ Claude Code" button |
| `stop_element_selection` | Disable selection overlay |
| `inspect_element` | Inspect a specific element by CSS selector |

### Monitoring

| Tool | Description |
|------|-------------|
| `get_console_logs` | Browser console messages, filterable by type (error, warn, all) |
| `get_network_requests` | Network requests with status, timing, and optional failed-only filter |
| `get_performance_metrics` | Core Web Vitals: LCP, FCP, CLS, INP |

### Component Analysis

| Tool | Description |
|------|-------------|
| `get_component_tree` | React/Vue component hierarchy with names and props |
| `find_component_source` | Locate source file for a component by name |

## How auto-input works

When you click "→ Claude Code" on the tooltip:

1. Full component info is saved to `.claude-browser/selections/{N}.txt`
2. A short reference `[Component #N: <Name>]` is typed into your terminal

Platform support:
- **macOS iTerm2** — `write text` AppleScript (instant)
- **macOS Terminal.app** — `keystroke` AppleScript fallback
- **Linux** — `xdotool type`
- **Windows** — PowerShell `SendKeys`

## Example Workflows

### Visual debugging
```
1. /claude-browser:inspect http://localhost:3000
2. Click on the broken element → [Component #1: <UserCard>]
3. "Fix [Component #1: <UserCard>], the avatar is overflowing its container"
```

### Performance audit
```
1. browser_launch("http://localhost:3000")
2. get_performance_metrics()        → Core Web Vitals
3. get_network_requests()           → slow/failed requests
4. browser_screenshot()             → visual state
```

### Autonomous monitoring
Claude can launch a headless browser in the background while coding:
```
1. browser_launch({ url: "http://localhost:3000", headless: true })
2. [make code changes]
3. browser_navigate("http://localhost:3000")  → reload
4. get_console_logs({ type: "error" })        → check for errors
5. get_network_requests({ failedOnly: true }) → check API failures
```

## Supported Frameworks

| Framework | Component Name | Props | Source File |
|-----------|:-:|:-:|:-:|
| React | ✓ | ✓ | ✓ (dev mode) |
| Vue 3 | ✓ | ✓ | ✓ |
| Svelte | ✓ | — | — |
| Plain HTML | tag + classes | — | — |

Element selection (tag, classes, styles, selector) works on **any** website regardless of framework.

## License

MIT
