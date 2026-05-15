declare class SerialMonitor {
    private lines;
    private maxLines;
    private currentLine;
    private callbacks;
    constructor();
    private init;
    getLines(): string[];
    onLine(cb: (lines: string[]) => void): void;
    clear(): void;
    private notify;
}
export declare const serialMonitor: SerialMonitor;
export {};
//# sourceMappingURL=serialMonitor.d.ts.map