import type { Page } from 'playwright';
export interface SelectedElementData {
    tagName: string;
    id: string;
    classes: string[];
    attributes: Record<string, string>;
    selector: string;
    styles: Record<string, string>;
    boundingRect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
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
    windowId?: string;
    terminalTty?: string;
}
declare class OverlayManager {
    private isActive;
    private lastSelected;
    private pendingResolve;
    private pendingReject;
    private exposedFunctions;
    private pageLoadHandler;
    private terminalIdentity;
    setTerminalIdentity(identity: TerminalIdentity): void;
    start(page: Page): Promise<void>;
    private injectOverlay;
    getSelectedElement(): SelectedElementData | null;
    waitForSelection(timeout?: number): Promise<SelectedElementData>;
    stop(page: Page): Promise<void>;
    isSelectionActive(): boolean;
}
export declare const overlayManager: OverlayManager;
export {};
