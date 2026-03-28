import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { Persona, PersonaPrompts } from "./types.js";

const USER_PERSONAS_DIR = join(homedir(), ".drftpnk", "personas");
const PROJECT_PERSONAS_DIR = join(process.cwd(), "personas");

function loadPromptFiles(personaDir: string): PersonaPrompts {
  const prompts: PersonaPrompts = {};
  if (!existsSync(personaDir)) return prompts;

  for (const file of readdirSync(personaDir)) {
    const content = readFileSync(join(personaDir, file), "utf-8").trim();

    if (file === "image.md") {
      if (!prompts["image"]) prompts["image"] = {};
      prompts["image"].content = content;
      continue;
    }

    let match: RegExpMatchArray | null;

    match = file.match(/^(.+)\.(outline|content)\.system\.md$/);
    if (match) {
      const [, type, mode] = match;
      if (!prompts[type]) prompts[type] = {};
      prompts[type][mode === "outline" ? "outlineSystem" : "contentSystem"] = content;
      continue;
    }

    match = file.match(/^(.+)\.(outline|content)\.md$/);
    if (match) {
      const [, type, mode] = match;
      if (!prompts[type]) prompts[type] = {};
      prompts[type][mode as "outline" | "content"] = content;
    }
  }

  return prompts;
}

function loadMdFile(personaDir: string, filename: string): string | undefined {
  const path = join(personaDir, filename);
  if (existsSync(path)) return readFileSync(path, "utf-8").trim();
  return undefined;
}

function readPersonaFile(filePath: string, personaDir: string): Persona | null {
  try {
    const persona = JSON.parse(readFileSync(filePath, "utf-8")) as Persona;

    const systemPrompt = loadMdFile(personaDir, "system_prompt.md");
    if (systemPrompt) persona.system_prompt = systemPrompt;

    const imageStylePrompt = loadMdFile(personaDir, "image-style.md");
    if (imageStylePrompt) persona.image_style_prompt = imageStylePrompt;

    const prompts = loadPromptFiles(personaDir);
    if (Object.keys(prompts).length > 0) persona.prompts = prompts;

    return persona;
  } catch {
    return null;
  }
}

export function loadPersona(id: string): Persona {
  const projectJson = join(PROJECT_PERSONAS_DIR, `${id}.json`);
  const projectDir = join(PROJECT_PERSONAS_DIR, id);
  if (existsSync(projectJson)) {
    const persona = readPersonaFile(projectJson, projectDir);
    if (persona) return persona;
  }

  const userJson = join(USER_PERSONAS_DIR, `${id}.json`);
  const userDir = join(USER_PERSONAS_DIR, id);
  if (existsSync(userJson)) {
    const persona = readPersonaFile(userJson, userDir);
    if (persona) return persona;
  }

  throw new Error(`Persona "${id}" not found. Run: drftpnk personas list`);
}

export function listPersonas(): Persona[] {
  const personas: Map<string, Persona> = new Map();

  for (const baseDir of [USER_PERSONAS_DIR, PROJECT_PERSONAS_DIR]) {
    if (!existsSync(baseDir)) continue;
    for (const file of readdirSync(baseDir)) {
      if (!file.endsWith(".json")) continue;
      const id = file.replace(/\.json$/, "");
      const persona = readPersonaFile(join(baseDir, file), join(baseDir, id));
      if (persona) personas.set(persona.id, persona);
    }
  }

  return Array.from(personas.values());
}

export function savePersona(persona: Persona, global = false): void {
  const baseDir = global ? USER_PERSONAS_DIR : PROJECT_PERSONAS_DIR;
  const personaDir = join(baseDir, persona.id);

  if (!existsSync(baseDir)) mkdirSync(baseDir, { recursive: true });

  const { system_prompt, image_style_prompt, prompts, ...jsonFields } = persona;
  writeFileSync(join(baseDir, `${persona.id}.json`), JSON.stringify(jsonFields, null, 2));

  if (system_prompt || image_style_prompt) {
    if (!existsSync(personaDir)) mkdirSync(personaDir, { recursive: true });
    if (system_prompt) writeFileSync(join(personaDir, "system_prompt.md"), system_prompt + "\n");
    if (image_style_prompt)
      writeFileSync(join(personaDir, "image-style.md"), image_style_prompt + "\n");
  }

  if (prompts) {
    if (!existsSync(personaDir)) mkdirSync(personaDir, { recursive: true });
    for (const [type, promptSet] of Object.entries(prompts)) {
      if (promptSet.outlineSystem)
        writeFileSync(
          join(personaDir, `${type}.outline.system.md`),
          promptSet.outlineSystem + "\n",
        );
      if (promptSet.outline)
        writeFileSync(join(personaDir, `${type}.outline.md`), promptSet.outline + "\n");
      if (promptSet.contentSystem)
        writeFileSync(
          join(personaDir, `${type}.content.system.md`),
          promptSet.contentSystem + "\n",
        );
      if (promptSet.content)
        writeFileSync(join(personaDir, `${type}.content.md`), promptSet.content + "\n");
    }
  }
}

export function updatePersona(id: string, updates: Partial<Persona>): Persona {
  const existing = loadPersona(id);
  const updated = { ...existing, ...updates };

  const projectJson = join(PROJECT_PERSONAS_DIR, `${id}.json`);
  const inProject = existsSync(projectJson);
  savePersona(updated, !inProject);
  return updated;
}
