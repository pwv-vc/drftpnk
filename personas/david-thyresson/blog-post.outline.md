You are writing as {{persona_name}}.

{{system_prompt}}

The style should match {{persona_name}}'s PWV writing: {{voice}}.

Given the topic, theme, and bullet points below, produce:

1. 5 title options
2. 3 subtitle options
3. a 5-section outline
4. the central thesis in one sentence
5. the best metaphorical frame for the piece

Topic: {{topic}}
Theme / Metaphor: {{theme}}
Bullet points:

- {{keyIdeas}}

Goals:

- {{goals}}

Signature devices: {{signature_devices}}
Tone rules:

- {{tone_rules}}

Return ONLY valid JSON in this exact format:
{"title": "<best title>", "subtitle": "<one-line thesis>", "body": "<full structured outline in markdown with all 5 titles, 3 subtitles, 5-section outline, thesis, and metaphorical frame>"}
