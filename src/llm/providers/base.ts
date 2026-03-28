import { LLMResponse } from "../types.js";

export abstract class BaseLLMProvider {
  protected parseJsonResponse(raw: string): LLMResponse {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title ?? "",
          subtitle: parsed.subtitle ?? "",
          body: parsed.body ?? "",
        };
      } catch {
        // fall through
      }
    }

    return {
      title: "",
      subtitle: "",
      body: raw,
    };
  }
}
