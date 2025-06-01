import * as http from "http";
import { 
  ANKI_CONNECT_HOST, 
  ANKI_CONNECT_PORT, 
  ANKI_CONNECT_VERSION,
  DEFAULT_RETRIES,
  DEFAULT_DELAY,
  CHUNK_SIZE
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

                if (parsedData.result === null || parsedData.result === undefined) {
                  if (action === "updateNoteFields" || action === "replaceTags") {
                    resolve({} as T);
                    return;
                  }
                  reject(new AnkiError("AnkiConnect returned null/undefined result"));
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
    await this.request("createDeck", { deck: deckName });
  }

  async addNote(note: AnkiNote): Promise<number> {
    return await this.request<number>("addNote", { note });
  }

  async updateNoteFields(noteId: number, fields: Record<string, string>): Promise<void> {
    await this.request("updateNoteFields", {
      note: { id: noteId, fields }
    });
  }

  async replaceTags(noteIds: number[], tags: string[]): Promise<void> {
    await this.request("replaceTags", {
      notes: noteIds,
      tags: tags.join(" ")
    });
  }

  async getDeckNames(): Promise<string[]> {
    return await this.request<string[]>("deckNames");
  }

  async findNotes(query: string): Promise<number[]> {
    return await this.request<number[]>("findNotes", { query });
  }

  async getNotesInfo(noteIds: number[]): Promise<AnkiNoteInfo[]> {
    // Handle large batches by chunking
    const allNotes: AnkiNoteInfo[] = [];
    
    for (let i = 0; i < noteIds.length; i += CHUNK_SIZE) {
      const chunk = noteIds.slice(i, i + CHUNK_SIZE);
      const chunkNotes = await this.request<AnkiNoteInfo[]>("notesInfo", {
        notes: chunk,
      });
      allNotes.push(...chunkNotes);
    }
    
    return allNotes;
  }
}