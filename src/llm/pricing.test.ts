import { describe, it, expect } from "vitest";
import { calculateCost } from "./pricing.js";

describe("calculateCost", () => {
  it("calculates cost for gpt-4o", () => {
    const result = calculateCost("gpt-4o", 1_000_000, 1_000_000);
    expect(result.inputCost).toBeCloseTo(2.5);
    expect(result.outputCost).toBeCloseTo(10.0);
    expect(result.totalCost).toBeCloseTo(12.5);
  });

  it("calculates cost for gpt-4o-mini", () => {
    const result = calculateCost("gpt-4o-mini", 1_000_000, 1_000_000);
    expect(result.inputCost).toBeCloseTo(0.15);
    expect(result.outputCost).toBeCloseTo(0.6);
    expect(result.totalCost).toBeCloseTo(0.75);
  });

  it("calculates cost for gpt-4-turbo", () => {
    const result = calculateCost("gpt-4-turbo", 1_000_000, 1_000_000);
    expect(result.inputCost).toBeCloseTo(10.0);
    expect(result.outputCost).toBeCloseTo(30.0);
    expect(result.totalCost).toBeCloseTo(40.0);
  });

  it("calculates cost for gpt-3.5-turbo", () => {
    const result = calculateCost("gpt-3.5-turbo", 1_000_000, 1_000_000);
    expect(result.inputCost).toBeCloseTo(0.5);
    expect(result.outputCost).toBeCloseTo(1.5);
    expect(result.totalCost).toBeCloseTo(2.0);
  });

  it("scales correctly for small token counts", () => {
    const result = calculateCost("gpt-4o", 1000, 500);
    expect(result.inputCost).toBeCloseTo(0.0025);
    expect(result.outputCost).toBeCloseTo(0.005);
    expect(result.totalCost).toBeCloseTo(0.0075);
  });

  it("returns zero cost for zero tokens", () => {
    const result = calculateCost("gpt-4o", 0, 0);
    expect(result.inputCost).toBe(0);
    expect(result.outputCost).toBe(0);
    expect(result.totalCost).toBe(0);
  });

  it("totalCost equals inputCost + outputCost", () => {
    const result = calculateCost("gpt-4o", 847, 1203);
    expect(result.totalCost).toBeCloseTo(result.inputCost + result.outputCost);
  });

  it("falls back to gpt-4o pricing for unknown model", () => {
    const known = calculateCost("gpt-4o", 1_000_000, 1_000_000);
    const unknown = calculateCost("gpt-99-ultra", 1_000_000, 1_000_000);
    expect(unknown.inputCost).toBeCloseTo(known.inputCost);
    expect(unknown.outputCost).toBeCloseTo(known.outputCost);
  });

  it("handles o1 model pricing", () => {
    const result = calculateCost("o1", 1_000_000, 1_000_000);
    expect(result.inputCost).toBeCloseTo(15.0);
    expect(result.outputCost).toBeCloseTo(60.0);
  });

  it("handles o3-mini model pricing", () => {
    const result = calculateCost("o3-mini", 1_000_000, 1_000_000);
    expect(result.inputCost).toBeCloseTo(1.1);
    expect(result.outputCost).toBeCloseTo(4.4);
  });
});
