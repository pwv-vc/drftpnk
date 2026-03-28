import pc from "picocolors";

export type Debugger = (label: string, value?: string) => void;

export function createDebugger(enabled: boolean): Debugger {
  if (!enabled) return () => {};
  return (label: string, value?: string) => {
    const prefix = pc.dim("◆");
    const lbl = pc.dim(label);
    const val = value !== undefined ? pc.white(` ${value}`) : "";
    console.log(`  ${prefix} ${lbl}${val}`);
  };
}
