// jrherediaramirez/clanki-2.0/Clanki-2.0-6b23594186d62acc58f666efd8a075e8fcf06b78/src/services/anki.ts
import * as http from "http";
import {
  ANKI_CONNECT_HOST,
  ANKI_CONNECT_PORT,
  ANKI_CONNECT_VERSION,
  DEFAULT_RETRIES,
  DEFAULT_DELAY,
  CHUNK_SIZE,
  ANKI_ACTIONS
} from "../utils/constants.js";
import { AnkiResponse, AnkiNote, AnkiNoteInfo, ModelInfo, ModelTemplate } from "../types/anki.js"; // Ensure ModelInfo, ModelTemplate are imported
import { AnkiError } from "../utils/errors.js";

export class AnkiService {
  async request<T>(
    action: string,
    params: Record<string, any> = {},
    retries = DEFAULT_RETRIES,
    delay = DEFAULT_DELAY
  ): Promise<T> {
    console.error(`Attempting AnkiConnect request: ${action} with params:`, params);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await new Promise<T>((resolve, reject) => {
          const data = JSON.stringify({
            action,
            version: ANKI_CONNECT_VERSION,
            params,
          });

          console.error("Request payload:", data);

          const options = {
            hostname: ANKI_CONNECT_HOST,
            port: ANKI_CONNECT_PORT,
            path: "/",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(data),
            },
          };

          const req = http.request(options, (res) => {
            let responseData = "";

            res.on("data", (chunk: Buffer) => {
              responseData += chunk.toString();
            });

            res.on("end", () => {
              console.error(`AnkiConnect response status: ${res.statusCode}`);
              console.error(`AnkiConnect response body: ${responseData}`);

              if (res.statusCode !== 200) {
                reject(
                  new AnkiError(
                    `AnkiConnect request failed with status ${res.statusCode}: ${responseData}`
                  )
                );
                return;
              }

              try {
                const parsedData = JSON.parse(responseData) as AnkiResponse<T>;
                console.error("Parsed response:", parsedData);

                if (parsedData.error) {
                  reject(new AnkiError(`AnkiConnect error: ${parsedData.error}`));
                  return;
                }

                if (parsedData.result === null) {
                  // For actions where null is a valid success response (e.g., void operations or specific queries)
                  if (
                    action === ANKI_ACTIONS.UPDATE_NOTE_FIELDS ||
                    action === ANKI_ACTIONS.REPLACE_TAGS ||
                    action === ANKI_ACTIONS.DELETE_NOTES // deleteNotes returns null for success
                    // No special handling for MODEL_STYLING here, as it might return actual null for default CSS.
                    // getModelStyling will handle this and return "".
                  ) {
                    // For these specific actions, null result can be treated as success.
                    // We resolve with a generic success object or specific expected null type.
                    resolve(null as T); // Or specific type if T is known to be e.g. void then handle appropriately
                    return;
                  }
                  // For other actions, a null result might be unexpected unless T allows null.
                  // If MODEL_STYLING returns null, it's handled by the getModelStyling method to return "".
                  // If MODEL_TEMPLATES returns null, it would be an issue, getModelTemplates should handle.
                  // For now, if T is not void or a type that explicitly includes null, this is problematic.
                  // Let's allow `resolve(null as T)` if the specific caller (like getModelStyling) handles it.
                   if (action === ANKI_ACTIONS.MODEL_STYLING) {
                     resolve(null as T); // getModelStyling will convert this to ""
                     return;
                   }

                  // For other actions not explicitly listed, returning null when not expected is an error.
                  reject(new AnkiError(`AnkiConnect returned null result for action: ${action}`));
                  return;
                }
                // No need to check for parsedData.result === undefined specifically for DELETE_NOTES
                // as it's covered by the null check now if AnkiConnect guarantees null on success.
                // If it could also return undefined for success, that would need another condition.

                resolve(parsedData.result);
              } catch (parseError) {
                console.error("Parse error:", parseError);
                reject(
                  new AnkiError(`Failed to parse AnkiConnect response: ${responseData}`)
                );
              }
            });
          });

          req.on("error", (error: Error) => {
            console.error(`Error in ankiRequest (attempt ${attempt}/${retries}):`, error);
            reject(error);
          });

          req.write(data);
          req.end();
        });

        return result;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        console.error(`Attempt ${attempt}/${retries} failed, retrying after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    throw new AnkiError(`Failed after ${retries} attempts`);
  }

  async createDeck(deckName: string): Promise<void> {
    await this.request(ANKI_ACTIONS.CREATE_DECK, { deck: deckName });
  }

  async addNote(note: AnkiNote): Promise<number> {
    return await this.request<number>(ANKI_ACTIONS.ADD_NOTE, { note });
  }

  async updateNoteFields(noteId: number, fields: Record<string, string>): Promise<void> {
    await this.request(ANKI_ACTIONS.UPDATE_NOTE_FIELDS, {
      note: { id: noteId, fields }
    });
  }

  async replaceTags(noteIds: number[], tags: string[]): Promise<void> {
    await this.request(ANKI_ACTIONS.REPLACE_TAGS, {
      notes: noteIds,
      tags: tags.join(" ")
    });
  }

  async deleteNotes(noteIds: number[]): Promise<void> {
    if (noteIds.length === 0) {
      console.warn("deleteNotes called with empty array of note IDs.");
      return;
    }
    // AnkiConnect's deleteNotes action returns null on success.
    // The request method's null handling for DELETE_NOTES resolves.
    await this.request<null>(ANKI_ACTIONS.DELETE_NOTES, { notes: noteIds });
  }

  async getDeckNames(): Promise<string[]> {
    return await this.request<string[]>(ANKI_ACTIONS.DECK_NAMES);
  }

  async findNotes(query: string): Promise<number[]> {
    return await this.request<number[]>(ANKI_ACTIONS.FIND_NOTES, { query });
  }

  async getNotesInfo(noteIds: number[]): Promise<AnkiNoteInfo[]> {
    const allNotes: AnkiNoteInfo[] = [];
    for (let i = 0; i < noteIds.length; i += CHUNK_SIZE) {
      const chunk = noteIds.slice(i, i + CHUNK_SIZE);
      const chunkNotes = await this.request<AnkiNoteInfo[]>(ANKI_ACTIONS.NOTES_INFO, {
        notes: chunk,
      });
      allNotes.push(...chunkNotes);
    }
    return allNotes;
  }

  // --- Model/Note Type Operations ---

  async getModelNames(): Promise<string[]> {
    return await this.request<string[]>(ANKI_ACTIONS.MODEL_NAMES);
  }

  async getModelFieldNames(modelName: string): Promise<string[]> {
    return await this.request<string[]>(ANKI_ACTIONS.MODEL_FIELD_NAMES, { modelName });
  }

  /**
   * Fetches model templates from AnkiConnect.
   * AnkiConnect returns an object where keys are template names and values are
   * objects like { Front: "html", Back: "html" }.
   * This method transforms it into an array of ModelTemplate objects.
   */
  async getModelTemplates(modelName: string): Promise<ModelTemplate[]> {
    const templatesResult = await this.request<Record<string, { Front: string; Back: string }>>(
      ANKI_ACTIONS.MODEL_TEMPLATES,
      { modelName }
    );

    if (!templatesResult || typeof templatesResult !== 'object') {
      console.warn(`Received unexpected or null templates data for ${modelName}:`, templatesResult);
      return []; // Return empty array if data is not as expected
    }

    // Transform the object into an array of ModelTemplate
    // Assuming your ModelTemplate interface is { name: string, qfmt: string, afmt: string }
    return Object.entries(templatesResult).map(([templateName, templateData]) => ({
      name: templateName,
      qfmt: templateData.Front, // Map 'Front' from AnkiConnect to 'qfmt'
      afmt: templateData.Back,  // Map 'Back' from AnkiConnect to 'afmt'
    }));
  }

  async getModelStyling(modelName: string): Promise<string> {
    // AnkiConnect for modelStyling can return:
    // 1. An object like { css: "..." }
    // 2. The CSS string directly
    // 3. null if there's no custom styling (uses default)
    const result = await this.request<{ css: string } | string | null>(ANKI_ACTIONS.MODEL_STYLING, { modelName });

    if (result === null) { // Explicitly handle null for default styling
        return ""; // Return empty string for default/no custom CSS
    } else if (typeof result === 'string') {
        return result;
    } else if (result && typeof result.css === 'string') {
        return result.css;
    }
    console.warn(`Unexpected styling format for ${modelName}:`, result);
    return ""; // Fallback for unexpected format
  }

  async getModelInfo(modelName: string): Promise<ModelInfo> {
    const [fields, templates, css] = await Promise.all([
      this.getModelFieldNames(modelName),
      this.getModelTemplates(modelName), // This will now correctly return ModelTemplate[]
      this.getModelStyling(modelName)
    ]);

    return {
      modelName,
      fields,
      templates, // Should now be an array, fixing the .map() error
      css: css,     // getModelStyling ensures this is a string
      isCloze: modelName.toLowerCase().includes('cloze') // Basic heuristic
    };
  }

  async getAllModelsInfo(): Promise<Record<string, ModelInfo>> {
    const modelNames = await this.getModelNames();
    const modelsInfo: Record<string, ModelInfo> = {};
    for (const modelName of modelNames) {
      try {
        modelsInfo[modelName] = await this.getModelInfo(modelName);
      } catch (error) {
        console.error(`Failed to get info for model ${modelName}:`, error);
        // Optionally skip this model or add partial info with an error flag
      }
    }
    return modelsInfo;
  }

  async addNoteWithValidation(note: AnkiNote): Promise<number> {
    const validFields = await this.getModelFieldNames(note.modelName);
    const providedFields = Object.keys(note.fields);
    const invalidFields = providedFields.filter(field => !validFields.includes(field));

    if (invalidFields.length > 0) {
      throw new AnkiError(
        `Invalid fields for model "${note.modelName}": ${invalidFields.join(', ')}. ` +
        `Valid fields are: ${validFields.join(', ')}`
      );
    }
    return await this.addNote(note);
  }
}