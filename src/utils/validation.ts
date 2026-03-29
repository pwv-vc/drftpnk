import pc from "picocolors";
import { ValidationResult } from "../plugins/types.js";

export function validateAndExit(validation: ValidationResult, context?: string): void {
  if (!validation.valid) {
    console.error(pc.red(`Validation failed${context ? ` (${context})` : ""}:`));
    for (const err of validation.errors) {
      console.error(pc.red(`  - ${err}`));
    }
    process.exit(1);
  }
}
