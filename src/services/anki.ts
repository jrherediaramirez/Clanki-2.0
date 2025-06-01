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
import { AnkiResponse, AnkiNote, AnkiNoteInfo } from "../types/anki.js";
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

                // Handle null results for specific actions
                if (parsedData.result === null) {
                  if (
                    action === ANKI_ACTIONS.UPDATE_NOTE_FIELDS ||
                    action === ANKI_ACTIONS.REPLACE_TAGS ||
                    action === ANKI_ACTIONS.DELETE_NOTES
                  ) {
                    resolve({ success: true } as T);
                    return;
                  }
                  reject(new AnkiError(`AnkiConnect returned null result for action: ${action}`));
                  return;
                }

                if (parsedData.result === undefined && action !== ANKI_ACTIONS.DELETE_NOTES) {
                  reject(new AnkiError("AnkiConnect returned undefined result"));
                  return;
                }

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
        delay *= 2;
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
    await this.request<null>(ANKI_ACTIONS.DELETE_NOTES, { notes: noteIds });
    // deleteNotes returns null on success; request() handles it
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
}
