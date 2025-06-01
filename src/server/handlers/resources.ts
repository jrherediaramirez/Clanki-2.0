import { AnkiService } from "../../services/anki.js";
import { ResourceInfo, ResourceContent } from "../../types/mcp.js";
import { AnkiCard } from "../../types/anki.js";
import { AnkiError } from "../../utils/errors.js";

export async function listResources(ankiService: AnkiService): Promise<{ resources: ResourceInfo[] }> {
  try {
    const decks = await ankiService.getDeckNames();
    return {
      resources: decks.map((deck) => ({
        uri: `anki://deck/${encodeURIComponent(deck)}`,
        name: deck,
        description: `Anki deck: ${deck}`,
      })),
    };
  } catch (error) {
    console.error("Error listing resources:", error);
    throw error;
  }
}

export async function readResource(uri: string, ankiService: AnkiService): Promise<{ contents: ResourceContent[] }> {
  try {
    const match = uri.match(/^anki:\/\/deck\/(.+)$/);

    if (!match) {
      throw new AnkiError(`Invalid resource URI: ${uri}`);
    }

    const deckName = decodeURIComponent(match[1]);
    console.error(`Attempting to fetch cards for deck: ${deckName}`);

    const noteIds = await ankiService.findNotes(`deck:"${deckName}"`);
    console.error(`Found ${noteIds.length} notes in deck ${deckName}`);

    if (noteIds.length === 0) {
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `Deck: ${deckName}\n\nNo notes found in this deck.`,
          },
        ],
      };
    }

    const allNotes = await ankiService.getNotesInfo(noteIds);
    console.error(`Retrieved ${allNotes.length} notes total`);

    const cardInfo: AnkiCard[] = allNotes.map((note) => {
      const baseCard: AnkiCard = {
        noteId: note.noteId,
        tags: note.tags,
        fields: {
          Front: { value: "[Unknown note type]" },
          Back: { value: "[Unknown note type]" },
        },
      };

      if (note.modelName === "Cloze") {
        baseCard.fields.Front = { value: note.fields.Text?.value || "" };
        baseCard.fields.Back = { value: note.fields["Back Extra"]?.value || "[Cloze deletion]" };
      } else if (note.modelName === "Basic") {
        baseCard.fields.Front = { value: note.fields.Front?.value || "" };
        baseCard.fields.Back = { value: note.fields.Back?.value || "" };
        if (note.fields.Hint) {
          baseCard.fields.Hint = { value: note.fields.Hint.value };
        }
      } else {
        if (note.fields.Front) baseCard.fields.Front = { value: note.fields.Front.value };
        if (note.fields.Back) baseCard.fields.Back = { value: note.fields.Back.value };
        if (note.fields.Hint) baseCard.fields.Hint = { value: note.fields.Hint.value };
        console.error(`Unknown or unhandled note type for display: ${note.modelName} - using available Front/Back/Hint fields.`);
      }
      
      return baseCard;
    });

    const deckContent = cardInfo
      .map((card) => {
        let content = `Note ID: ${card.noteId}\nFront: ${card.fields.Front.value}\nBack: ${card.fields.Back.value}`;
        if (card.fields.Hint?.value) {
          content += `\nHint: ${card.fields.Hint.value}`;
        }
        content += `\nTags: ${card.tags.join(", ")}\n---`;
        return content;
      })
      .join("\n");

    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: `Deck: ${deckName}\n\n${deckContent}`,
        },
      ],
    };
  } catch (error) {
    console.error(`Error reading deck: ${error}`);
    throw new AnkiError(
      `Failed to read deck: ${
        error instanceof Error ? error.message : "Unknown error"
      }. Make sure Anki is running and AnkiConnect plugin is installed.`
    );
  }
}