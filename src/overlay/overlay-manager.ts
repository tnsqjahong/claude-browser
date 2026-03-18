import type { Page } from 'playwright';
import { execSync, exec } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { OVERLAY_STYLES } from './overlay-styles.js';
import { OVERLAY_SCRIPT } from './overlay-script.js';

export interface SelectedElementData {
  tagName: string;
  id: string;
  classes: string[];
  attributes: Record<string, string>;
  selector: string;
  styles: Record<string, string>;
  boundingRect: { x: number; y: number; width: number; height: number };
  textContent: string;
  component: {
    framework: string;
    componentName: string;
    sourceFile: string | null;
    lineNumber: number | null;
    columnNumber: number | null;
    props: Record<string, unknown>;
  } | null;
  componentHierarchy: Array<{
    componentName: string;
    framework: string;
    sourceFile: string | null;
  }>;
  formattedText?: string;
}

export interface TerminalIdentity {
  termProgram: string;
  itermSessionId?: string;
  windowId?: string;       // Linux WINDOWID
  terminalTty?: string;    // TTY path for Terminal.app
}

class OverlayManager {
  private isActive = false;
  private lastSelected: SelectedElementData | null = null;
  private pendingResolve: ((data: SelectedElementData) => void) | null = null;
  private pendingReject: ((reason: unknown) => void) | null = null;
  private exposedFunctions = new Set<string>();
  private pageLoadHandler: (() => Promise<void>) | null = null;
  private terminalIdentity: TerminalIdentity | null = null;

  setTerminalIdentity(identity: TerminalIdentity): void {
    this.terminalIdentity = identity;
  }

  async start(page: Page): Promise<void> {
    if (!this.exposedFunctions.has('__claudeInspect_onElementSelected')) {
      await page.exposeFunction('__claudeInspect_onElementSelected', (dataJson: string) => {
        try {
          const data = JSON.parse(dataJson) as SelectedElementData;
          this.lastSelected = data;
          if (this.pendingResolve) {
            const resolve = this.pendingResolve;
            this.pendingResolve = null;
            this.pendingReject = null;
            resolve(data);
          }
        } catch {
          // ignore parse errors
        }
      });
      this.exposedFunctions.add('__claudeInspect_onElementSelected');
    }

    if (!this.exposedFunctions.has('__claudeInspect_onSelectionCancelled')) {
      await page.exposeFunction('__claudeInspect_onSelectionCancelled', () => {
        if (this.pendingReject) {
          const reject = this.pendingReject;
          this.pendingResolve = null;
          this.pendingReject = null;
          reject(new Error('Selection cancelled by user'));
        }
      });
      this.exposedFunctions.add('__claudeInspect_onSelectionCancelled');
    }

    // Send to Claude Code: save full info to file, type short reference into terminal
    if (!this.exposedFunctions.has('__claudeInspect_sendToClaudeCode')) {
      let selectionCounter = 0;

      // Resolve terminal app from captured identity (launch-time) or fallback to current env
      const ti = this.terminalIdentity;
      const termProgram = ti?.termProgram || process.env.TERM_PROGRAM || '';
      let appName = '';
      if (termProgram.includes('iTerm')) appName = 'iTerm2';
      else if (termProgram === 'Apple_Terminal') appName = 'Terminal';
      else if (termProgram.includes('Warp')) appName = 'Warp';
      else if (termProgram.includes('vscode')) appName = 'Visual Studio Code';
      else appName = 'iTerm2';

      await page.exposeFunction('__claudeInspect_sendToClaudeCode', (fullText: string, componentName: string) => {
        try {
          selectionCounter++;

          // Save full info to file
          const dir = join(process.cwd(), '.claude-inspect', 'selections');
          mkdirSync(dir, { recursive: true });
          writeFileSync(join(dir, `${selectionCounter}.txt`), fullText, 'utf-8');

          // Type short reference into the original terminal that launched inspect
          const shortRef = `[Component #${selectionCounter}: <${componentName}>]`;

          if (process.platform === 'darwin') {
            const escaped = shortRef.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

            if (appName === 'iTerm2' && ti?.itermSessionId) {
              // iTerm2: target the exact session that launched inspect
              // ITERM_SESSION_ID is "w0t0p0:UUID" but AppleScript uses UUID only
              const uuid = ti.itermSessionId.includes(':')
                ? ti.itermSessionId.split(':')[1]
                : ti.itermSessionId;
              const script = `
                tell application "iTerm2"
                  repeat with w in windows
                    repeat with t in tabs of w
                      repeat with s in sessions of t
                        if id of s is "${uuid}" then
                          tell s to write text "${escaped}" newline no
                          return
                        end if
                      end repeat
                    end repeat
                  end repeat
                end tell`;
              exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
            } else if (appName === 'iTerm2') {
              // iTerm2 fallback: no session ID captured
              exec(`osascript -e 'tell application "iTerm2" to tell current session of current window to write text "${escaped}" newline no'`);
            } else {
              // Terminal.app / others: pbcopy + keystroke fallback
              execSync('pbcopy', { input: shortRef });
              exec(`osascript -e 'tell application "${appName}" to activate' -e 'delay 0.5' -e 'tell application "System Events" to keystroke (do shell script "pbpaste")'`);
            }
          } else if (process.platform === 'linux') {
            if (ti?.windowId) {
              // Linux: target the exact window that launched inspect
              const escaped = shortRef.replace(/'/g, "'\\''");
              exec(`xdotool type --window ${ti.windowId} --delay 0 '${escaped}'`);
            } else {
              const escaped = shortRef.replace(/'/g, "'\\''");
              exec(`xdotool type --delay 0 '${escaped}'`);
            }
          } else if (process.platform === 'win32') {
            // Windows: PowerShell SendKeys (no reliable window targeting)
            const escaped = shortRef.replace(/'/g, "''");
            exec(`powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escaped}')"`)
          }

          return selectionCounter;
        } catch {
          return 0;
        }
      });
      this.exposedFunctions.add('__claudeInspect_sendToClaudeCode');
    }

    await this.injectOverlay(page);
    this.isActive = true;

    this.pageLoadHandler = async () => {
      if (this.isActive) {
        await this.injectOverlay(page);
      }
    };
    page.on('load', this.pageLoadHandler);
  }

  private async injectOverlay(page: Page): Promise<void> {
    await page.addStyleTag({ content: OVERLAY_STYLES });
    await page.evaluate(OVERLAY_SCRIPT);
  }

  getSelectedElement(): SelectedElementData | null {
    return this.lastSelected;
  }

  async waitForSelection(timeout = 30000): Promise<SelectedElementData> {
    return new Promise<SelectedElementData>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;

      setTimeout(() => {
        if (this.pendingReject === reject) {
          this.pendingResolve = null;
          this.pendingReject = null;
          reject(new Error('Selection timed out'));
        }
      }, timeout);
    });
  }

  async stop(page: Page): Promise<void> {
    if (this.pageLoadHandler) {
      page.off('load', this.pageLoadHandler);
      this.pageLoadHandler = null;
    }

    try {
      await page.evaluate(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        document.dispatchEvent(event);
      });
    } catch {
      // Page may be closed or navigating; ignore errors
    }

    this.isActive = false;

    if (this.pendingReject) {
      const reject = this.pendingReject;
      this.pendingResolve = null;
      this.pendingReject = null;
      reject(new Error('Overlay stopped'));
    }
  }

  isSelectionActive(): boolean {
    return this.isActive;
  }
}

export const overlayManager = new OverlayManager();
