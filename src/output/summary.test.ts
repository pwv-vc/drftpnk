import { describe, it, expect } from "vitest";
import { formatFileSize, formatCost, formatTokens } from "./summary.js";

describe("formatFileSize", () => {
  it("formats bytes under 1024 as B", () => {
    expect(formatFileSize(512)).toBe("512 B");
  });

  it("formats exactly 1024 bytes as 1.0 KB", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
  });

  it("formats 1536 bytes as 1.5 KB", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("formats 2048 bytes as 2.0 KB", () => {
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });

  it("formats 0 bytes as 0 B", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats large file correctly", () => {
    expect(formatFileSize(10240)).toBe("10.0 KB");
  });
});

describe("formatCost", () => {
  it("formats zero as $0.0000", () => {
    expect(formatCost(0)).toBe("$0.0000");
  });

  it("formats a typical small cost to 4 decimal places", () => {
    expect(formatCost(0.0122)).toBe("$0.0122");
  });

  it("formats a larger cost to 4 decimal places", () => {
    expect(formatCost(1.5)).toBe("$1.5000");
  });

  it("uses exponential notation for very small costs", () => {
    const result = formatCost(0.000001);
    expect(result).toMatch(/^\$/);
    expect(result).toContain("e");
  });

  it("formats cost at the 0.0001 boundary normally", () => {
    expect(formatCost(0.0001)).toBe("$0.0001");
  });
});

describe("formatTokens", () => {
  it("formats small numbers without separator", () => {
    expect(formatTokens(847)).toBe("847");
  });

  it("formats thousands with comma separator", () => {
    expect(formatTokens(1203)).toBe("1,203");
  });

  it("formats zero", () => {
    expect(formatTokens(0)).toBe("0");
  });

  it("formats large numbers with commas", () => {
    expect(formatTokens(1000000)).toBe("1,000,000");
  });
});
