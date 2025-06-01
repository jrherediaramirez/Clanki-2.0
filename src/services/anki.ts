// jrherediaramirez/clanki-2.0/Clanki-2.0-1d283c2993367a1c1328c9d2d934ce5dda7fc44f/src/services/anki.ts
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
import { AnkiResponse, AnkiNote, AnkiNoteInfo, ModelInfo, ModelTemplate, AnkiCardInfo, DeckStats as AnkiDeckStatsTypeFromTypes } from "../types/anki.js"; //
import { AnkiError } from "../utils/errors.js"; //

// Interface for the raw stats object returned by AnkiConnect's getDeckStats
// This might be more detailed or differently structured than the DeckStats type used by the tool.
export interface RawDeckStatsFromAnkiConnect {
  deck_id: number;
  name: string;
  new_count: number;
  learn_count: number;
  review_count: number;
  total_in_deck: number;
  // Add other fields that AnkiConnect might return for deck stats
  [key: string]: any; // Allow other properties
}


export class AnkiService {
  async request<T>(
    action: string,
    params: Record<string, any> = {},
    retries = DEFAULT_RETRIES,
    delay = DEFAULT_DELAY
  ): Promise<T> {
    console.error(`Attempting AnkiConnect request: ${action} with params:`, params); //

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await new Promise<T>((resolve, reject) => {
          const data = JSON.stringify({
            action,
            version: ANKI_CONNECT_VERSION, //
            params,
          });

          console.error("Request payload:", data); //

          const options = {
            hostname: ANKI_CONNECT_HOST, //
            port: ANKI_CONNECT_PORT, //
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
              console.error(`AnkiConnect response status: ${res.statusCode}`); //
              console.error(`AnkiConnect response body: ${responseData}`); //

              if (res.statusCode !== 200) {
                reject(
                  new AnkiError( //
                    `AnkiConnect request failed with status ${res.statusCode}: ${responseData}` //
                  )
                );
                return;
              }

              try {
                const parsedData = JSON.parse(responseData) as AnkiResponse<T>; //
                console.error("Parsed response:", parsedData); //

                if (parsedData.error) {
                  reject(new AnkiError(`AnkiConnect error: ${parsedData.error}`)); //
                  return;
                }

                if (parsedData.result === null) {
                  if (
                    action === ANKI_ACTIONS.UPDATE_NOTE_FIELDS || //
                    action === ANKI_ACTIONS.REPLACE_TAGS || //
                    action === ANKI_ACTIONS.DELETE_NOTES || //
                    action === ANKI_ACTIONS.MODEL_STYLING || //
                    // Add new actions that correctly return null on success
                    action === ANKI_ACTIONS.DELETE_DECKS ||
                    action === ANKI_ACTIONS.SUSPEND ||
                    action === ANKI_ACTIONS.UNSUSPEND
                  ) {
                    resolve(null as T);
                    return;
                  }
                  reject(new AnkiError(`AnkiConnect returned null result for action: ${action}`)); //
                  return;
                }
                resolve(parsedData.result);
              } catch (parseError) {
                console.error("Parse error:", parseError); //
                reject(
                  new AnkiError(`Failed to parse AnkiConnect response: ${responseData}`) //
                );
              }
            });
          });

          req.on("error", (error: Error) => {
            console.error(`Error in ankiRequest (attempt ${attempt}/${retries}):`, error); //
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
        console.error(`Attempt ${attempt}/${retries} failed, retrying after ${delay}ms...`); //
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    throw new AnkiError(`Failed after ${retries} attempts`); //
  }

  async createDeck(deckName: string): Promise<void> {
    await this.request(ANKI_ACTIONS.CREATE_DECK, { deck: deckName }); //
  }

  async addNote(note: AnkiNote): Promise<number> {
    return await this.request<number>(ANKI_ACTIONS.ADD_NOTE, { note }); //
  }

  async updateNoteFields(noteId: number, fields: Record<string, string>): Promise<void> {
    await this.request(ANKI_ACTIONS.UPDATE_NOTE_FIELDS, { //
      note: { id: noteId, fields }
    });
  }

  async replaceTags(noteIds: number[], tags: string[]): Promise<void> {
    await this.request(ANKI_ACTIONS.REPLACE_TAGS, { //
      notes: noteIds,
      tags: tags.join(" ")
    });
  }

  async deleteNotes(noteIds: number[]): Promise<void> {
    if (noteIds.length === 0) {
      console.warn("deleteNotes called with empty array of note IDs."); //
      return;
    }
    await this.request<null>(ANKI_ACTIONS.DELETE_NOTES, { notes: noteIds }); //
  }

  async getDeckNames(): Promise<string[]> {
    return await this.request<string[]>(ANKI_ACTIONS.DECK_NAMES); //
  }

  async findNotes(query: string): Promise<number[]> {
    return await this.request<number[]>(ANKI_ACTIONS.FIND_NOTES, { query }); //
  }

  async getNotesInfo(noteIds: number[]): Promise<AnkiNoteInfo[]> {
    const allNotes: AnkiNoteInfo[] = [];
    for (let i = 0; i < noteIds.length; i += CHUNK_SIZE) { //
      const chunk = noteIds.slice(i, i + CHUNK_SIZE);
      const chunkNotes = await this.request<AnkiNoteInfo[]>(ANKI_ACTIONS.NOTES_INFO, { //
        notes: chunk,
      });
      allNotes.push(...chunkNotes);
    }
    return allNotes;
  }

  // --- Model/Note Type Operations ---

  async getModelNames(): Promise<string[]> {
    return await this.request<string[]>(ANKI_ACTIONS.MODEL_NAMES); //
  }

  async getModelFieldNames(modelName: string): Promise<string[]> {
    return await this.request<string[]>(ANKI_ACTIONS.MODEL_FIELD_NAMES, { modelName }); //
  }

  async getModelTemplates(modelName: string): Promise<ModelTemplate[]> {
    const templatesResult = await this.request<Record<string, { Front: string; Back: string }>>( //
      ANKI_ACTIONS.MODEL_TEMPLATES, //
      { modelName }
    );

    if (!templatesResult || typeof templatesResult !== 'object') {
      console.warn(`Received unexpected or null templates data for ${modelName}:`, templatesResult); //
      return []; 
    }
    return Object.entries(templatesResult).map(([templateName, templateData]) => ({ //
      name: templateName,
      qfmt: templateData.Front, 
      afmt: templateData.Back,  
    }));
  }

  async getModelStyling(modelName: string): Promise<string> {
    const result = await this.request<{ css: string } | string | null>(ANKI_ACTIONS.MODEL_STYLING, { modelName }); //

    if (result === null) { 
        return ""; 
    } else if (typeof result === 'string') {
        return result;
    } else if (result && typeof result.css === 'string') {
        return result.css;
    }
    console.warn(`Unexpected styling format for ${modelName}:`, result); //
    return ""; 
  }

  async getModelInfo(modelName: string): Promise<ModelInfo> {
    const [fields, templates, css] = await Promise.all([
      this.getModelFieldNames(modelName), //
      this.getModelTemplates(modelName), //
      this.getModelStyling(modelName) //
    ]);

    return {
      modelName,
      fields,
      templates, 
      css: css,     
      isCloze: modelName.toLowerCase().includes('cloze') 
    };
  }

  async getAllModelsInfo(): Promise<Record<string, ModelInfo>> {
    const modelNames = await this.getModelNames(); //
    const modelsInfo: Record<string, ModelInfo> = {};
    for (const modelName of modelNames) {
      try {
        modelsInfo[modelName] = await this.getModelInfo(modelName); //
      } catch (error) {
        console.error(`Failed to get info for model ${modelName}:`, error); //
      }
    }
    return modelsInfo;
  }

  async addNoteWithValidation(note: AnkiNote): Promise<number> {
    const validFields = await this.getModelFieldNames(note.modelName); //
    const providedFields = Object.keys(note.fields);
    const invalidFields = providedFields.filter(field => !validFields.includes(field));

    if (invalidFields.length > 0) {
      throw new AnkiError( //
        `Invalid fields for model "${note.modelName}": ${invalidFields.join(', ')}. ` +
        `Valid fields are: ${validFields.join(', ')}`
      );
    }
    return await this.addNote(note); //
  }

  // --- NEW METHODS FOR ADDITIONAL FUNCTIONALITY ---

  /**
   * Deletes one or more decks.
   * @param deckNames - An array of deck names to delete.
   * @returns Promise<void>
   */
  async deleteDecks(deckNames: string[]): Promise<void> {
    if (deckNames.length === 0) {
      console.warn("deleteDecks called with an empty array of deck names.");
      return;
    }
    // AnkiConnect's deleteDecks action returns null on success.
    await this.request<null>(ANKI_ACTIONS.DELETE_DECKS, { decks: deckNames });
  }

  /**
   * Gets statistics for one or more decks.
   * @param deckNames - An array of deck names.
   * @returns A promise that resolves to a record where keys are deck names
   * and values are the statistics objects for each deck.
   */
  async getDeckStats(deckNames: string[]): Promise<Record<string, RawDeckStatsFromAnkiConnect>> {
    if (deckNames.length === 0) {
      console.warn("getDeckStats called with an empty array of deck names.");
      return {};
    }
    // AnkiConnect's getDeckStats takes an array of deck names and returns a map of deck name to stats object.
    return await this.request<Record<string, RawDeckStatsFromAnkiConnect>>(
      ANKI_ACTIONS.GET_DECK_STATS, // Ensure GET_DECK_STATS is in ANKI_ACTIONS
      { decks: deckNames }
    );
  }

  /**
   * Retrieves detailed information for specific cards.
   * @param cardIds - An array of card IDs.
   * @returns A promise that resolves to an array of AnkiCardInfo objects.
   */
  async getCardsInfo(cardIds: number[]): Promise<AnkiCardInfo[]> {
    if (cardIds.length === 0) {
      console.warn("getCardsInfo called with an empty array of card IDs.");
      return [];
    }
    const allCardsInfo: AnkiCardInfo[] = [];
    // Chunking similar to getNotesInfo if dealing with potentially large arrays
    for (let i = 0; i < cardIds.length; i += CHUNK_SIZE) {
        const chunk = cardIds.slice(i, i + CHUNK_SIZE);
        const chunkCardInfo = await this.request<AnkiCardInfo[]>(ANKI_ACTIONS.CARDS_INFO, {
            cards: chunk,
        });
        allCardsInfo.push(...chunkCardInfo);
    }
    return allCardsInfo;
  }


  /**
   * Finds cards based on a query.
   * @param query - The Anki search query string.
   * @returns A promise that resolves to an array of card IDs.
   */
  async findCards(query: string): Promise<number[]> {
    return await this.request<number[]>(ANKI_ACTIONS.FIND_CARDS, { query });
  }

  /**
   * Suspends one or more cards.
   * @param cardIds - An array of card IDs to suspend.
   * @returns Promise<void>
   */
  async suspendCards(cardIds: number[]): Promise<void> {
    if (cardIds.length === 0) {
      console.warn("suspendCards called with an empty array of card IDs.");
      return;
    }
    // AnkiConnect's suspend action returns null on success.
    await this.request<null>(ANKI_ACTIONS.SUSPEND, { cards: cardIds });
  }

  /**
   * Unsuspends one or more cards.
   * @param cardIds - An array of card IDs to unsuspend.
   * @returns Promise<void>
   */
  async unsuspendCards(cardIds: number[]): Promise<void> {
    if (cardIds.length === 0) {
      console.warn("unsuspendCards called with an empty array of card IDs.");
      return;
    }
    // AnkiConnect's unsuspend action returns null on success.
    await this.request<null>(ANKI_ACTIONS.UNSUSPEND, { cards: cardIds });
  }

  /**
   * Renames a deck by moving its cards to a new deck name and deleting the old one.
   * @param currentDeckName - The current name of the deck.
   * @param newDeckName - The desired new name for the deck.
   */
  async renameDeck(currentDeckName: string, newDeckName: string): Promise<void> {
    // 1. Check if the current deck exists by trying to find cards in it.
    //    Alternatively, you could call getDeckNames and check, but findCards also gives us the cards to move.
    const cardIds = await this.findCards(`deck:"${currentDeckName}"`);

    const deckNames = await this.getDeckNames();
    if (!deckNames.includes(currentDeckName)) {
        throw new AnkiError(`Deck "${currentDeckName}" does not exist or is already empty (if findCards was empty). Cannot rename.`);
    }
    if (deckNames.includes(newDeckName)) {
        // Behavior here can be debated: error out, or merge?
        // For a simple rename, it's often expected the new name doesn't exist or will be overwritten (though Anki merges).
        // Let's assume for now we just move cards; if newDeckName exists, cards are added to it.
        console.warn(`Deck "${newDeckName}" already exists. Cards from "${currentDeckName}" will be moved into it.`);
    }


    if (cardIds.length > 0) {
      // 2. Move cards to the new deck name.
      //    AnkiConnect's changeDeck action will create the newDeckName if it doesn't exist.
      await this.request<null>(ANKI_ACTIONS.CHANGE_DECK, { // Ensure CHANGE_DECK is in ANKI_ACTIONS
        cards: cardIds,
        deck: newDeckName,
      });
      console.log(`Moved ${cardIds.length} cards from "${currentDeckName}" to "${newDeckName}".`);
    } else {
      console.log(`Deck "${currentDeckName}" has no cards to move. It might be an empty deck or a parent deck with subdecks.`);
      // If it's an empty deck, we still want to "rename" it by creating the new one (if needed) and deleting the old one.
      // Anki might create the newDeckName automatically if cards were moved. If no cards, ensure it exists if it's a simple rename.
      // For simplicity, we'll rely on deleteDecks to remove the old name.
      // If the newDeckName doesn't exist, and no cards are moved, it might not get created.
      // Consider calling createDeck(newDeckName) if cardIds.length === 0 and newDeckName doesn't exist yet.
      // However, if it's a parent deck, moving cards from sub-decks would be more complex.
      // For now, this handles moving cards from the specified deck itself.
    }

    // 3. Delete the old deck.
    //    If cards were moved, the old deck should now be empty or non-existent for other reasons.
    //    The `deleteDecks` action should remove it.
    //    Setting `cardsToo: true` (default) ensures that if any cards somehow remained, they are deleted with the deck.
    //    If the deck is already empty, it will just be deleted.
    try {
      await this.deleteDecks([currentDeckName]);
      console.log(`Successfully deleted old deck "${currentDeckName}" after renaming.`);
    } catch (deleteError) {
      // If the deck was already gone or couldn't be deleted, log it but don't necessarily fail the whole rename
      // if cards were successfully moved.
      console.warn(`Could not delete old deck "${currentDeckName}" after moving cards, or it was already gone. Error: ${deleteError}`);
      // Depending on strictness, you might re-throw or just log.
      // If card moving was the primary goal, and newDeckName has the cards, this might be a soft error.
    }
  }
}