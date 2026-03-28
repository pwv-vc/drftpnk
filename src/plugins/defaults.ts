export const DEFAULT_SYSTEM_PROMPT = `You are a skilled content writer. Write clearly, concisely, and with purpose. Favor short paragraphs, strong opening lines, and concrete examples over abstractions. Sound like a thoughtful human, not a content generator.`;

export function resolveSystemPrompt(persona: {
  system_prompt?: string;
  style: { voice: string[]; signature_devices: string[]; tone_rules: string[] };
  do_not?: string[];
}): string {
  const base = persona.system_prompt?.trim() || DEFAULT_SYSTEM_PROMPT;
  const parts = [base];
  if (persona.style.voice.length) parts.push(`Voice: ${persona.style.voice.join(", ")}`);
  if (persona.style.signature_devices.length)
    parts.push(`Signature devices: ${persona.style.signature_devices.join(", ")}`);
  if (persona.style.tone_rules.length) parts.push(`Tone: ${persona.style.tone_rules.join("; ")}`);
  if (persona.do_not?.length) parts.push(`Do NOT: ${persona.do_not.join("; ")}`);
  return parts.join("\n");
}
