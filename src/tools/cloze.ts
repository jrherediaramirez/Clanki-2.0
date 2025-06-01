import { AnkiService } from "../services/anki.js";
import { CreateClozeCardArgumentsSchema, UpdateClozeCardArgumentsSchema } from "../services/validation.js";
import { ToolResponse } from "../types/mcp.js"; // This now refers to the updated ToolResponse
import { NOTE_TYPES } from "../utils/constants.js";
import { AnkiError } from "../utils/errors.js";

export const createClozeCardTool = {
  name: "create-cloze-card",
  description: "Create a new cloze deletion card in a specified deck. Use {{c1::text}} syntax for cloze deletions.",
  inputSchema: {
    type: "object",
    properties: {
      deckName: {
        type: "string",
        description: "Name of the deck to add the card to",
      },
      text: {
        type: "string",
        description: "Text containing cloze deletions using {{c1::text}} syntax",
      },
      backExtra: {
        type: "string",
        description: "Optional extra information to show on the back of the card",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tags for the card",
      },
    },
    required: ["deckName", "text"],
  },
};

export const updateClozeCardTool = {
  name: "update-cloze-card",
  description: "Update an existing cloze deletion card",
  inputSchema: {
    type: "object",
    properties: {
      noteId: {
        type: "number",
        description: "ID of the note to update",
      },
      text: {
        type: "string",
        description: "New text with cloze deletions using {{c1::text}} syntax",
      },
      backExtra: {
        type: "string",
        description: "New extra information to show on the back of the card",
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

function validateClozeText(text: string): void {
  if (!text.includes("{{c") || !text.includes("}}")) {
    throw new AnkiError(
      "Text must contain at least one cloze deletion using {{c1::text}} syntax"
    );
  }
}

export async function handleCreateClozeCard(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  const { deckName, text, backExtra = "", tags = [] } = CreateClozeCardArgumentsSchema.parse(args);

  validateClozeText(text);

  const clozeFields: { Text: string; "Back Extra": string } = {
    Text: text,
    "Back Extra": backExtra,
  };

  await ankiService.addNote({
    deckName,
    modelName: NOTE_TYPES.CLOZE,
    fields: clozeFields,
    tags,
  });

  return {
    content: [
      {
        type: "text",
        text: { text: `Successfully created new cloze card in deck "${deckName}"` }, // Updated
      },
    ],
  };
}

export async function handleUpdateClozeCard(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  const { noteId, text, backExtra, tags } = UpdateClozeCardArgumentsSchema.parse(args);

  const noteInfo = await ankiService.getNotesInfo([noteId]);

  if (noteInfo.length === 0) {
    throw new AnkiError(`No note found with ID ${noteId}`);
  }

  if (noteInfo[0].modelName !== NOTE_TYPES.CLOZE) {
    throw new AnkiError("This note is not a cloze deletion note");
  }

  const fieldsToUpdate: Record<string, string> = {};
  
  if (text) {
    validateClozeText(text);
    fieldsToUpdate.Text = text;
  }
  
  if (backExtra !== undefined) { // Check for undefined to allow clearing the field
    fieldsToUpdate["Back Extra"] = backExtra;
  }

  if (Object.keys(fieldsToUpdate).length > 0) {
    await ankiService.updateNoteFields(noteId, fieldsToUpdate);
  }

  if (tags) { // Check if tags array is provided
    await ankiService.replaceTags([noteId], tags);
  }

  return {
    content: [
      {
        type: "text",
        text: { text: `Successfully updated cloze note ${noteId}` }, // Updated
      },
    ],
  };
}