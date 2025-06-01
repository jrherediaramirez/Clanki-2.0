import { AnkiService } from "../services/anki.js";
import { CreateCardArgumentsSchema, UpdateCardArgumentsSchema } from "../services/validation.js";
import { ToolResponse } from "../types/mcp.js"; // This now refers to the updated ToolResponse
import { NOTE_TYPES } from "../utils/constants.js";

export const createCardTool = {
  name: "create-card",
  description: "Create a new flashcard in a specified deck, with an optional hint.",
  inputSchema: {
    type: "object",
    properties: {
      deckName: {
        type: "string",
        description: "Name of the deck to add the card to",
      },
      front: {
        type: "string",
        description: "Front side content of the card",
      },
      back: {
        type: "string",
        description: "Back side content of the card",
      },
      hint: {
        type: "string",
        description: "Optional hint for the card (ensure your Anki note type has a 'Hint' field)",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tags for the card",
      },
    },
    required: ["deckName", "front", "back"],
  },
};

export const updateCardTool = {
  name: "update-card",
  description: "Update an existing flashcard",
  inputSchema: {
    type: "object",
    properties: {
      noteId: {
        type: "number",
        description: "ID of the note to update",
      },
      front: {
        type: "string",
        description: "New front side content",
      },
      back: {
        type: "string",
        description: "New back side content",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "New tags for the card",
      },
    },
    required: ["noteId"],
  },
};

export async function handleCreateCard(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  const { deckName, front, back, hint, tags = [] } = CreateCardArgumentsSchema.parse(args);

  const ankiFields: { Front: string; Back: string; Hint?: string } = {
    Front: front,
    Back: back,
  };

  if (hint) {
    ankiFields.Hint = hint;
  }

  await ankiService.addNote({
    deckName,
    modelName: NOTE_TYPES.BASIC,
    fields: ankiFields,
    tags,
  });

  return {
    content: [
      {
        type: "text",
        text: { text: `Successfully created new card in deck "${deckName}"${hint ? " with a hint." : "."}` }, // Updated
      },
    ],
  };
}

export async function handleUpdateCard(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  const { noteId, front, back, tags } = UpdateCardArgumentsSchema.parse(args);

  const fieldsToUpdate: Record<string, string> = {};
  if (front) fieldsToUpdate.Front = front;
  if (back) fieldsToUpdate.Back = back;

  if (Object.keys(fieldsToUpdate).length > 0) {
    await ankiService.updateNoteFields(noteId, fieldsToUpdate);
  }

  if (tags) {
    await ankiService.replaceTags([noteId], tags);
  }

  return {
    content: [
      {
        type: "text",
        text: { text: `Successfully updated note ${noteId}` }, // Updated
      },
    ],
  };
}