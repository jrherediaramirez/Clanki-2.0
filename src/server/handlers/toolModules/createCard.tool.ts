// src/server/handlers/toolModules/createCard.tool.ts

// Import necessary types, services, and constants
// Tool type for defining the tool structure.
import { Tool } from "@modelcontextprotocol/sdk/types.js";
// ToolResponse for the expected output structure.
import { ToolResponse } from "../../../types/mcp.js";
// AnkiService for interacting with AnkiConnect.
import { AnkiService } from "../../../services/anki.js";
// CreateCardArgumentsSchema for validating input arguments.
import { CreateCardArgumentsSchema } from "../../../services/validation.js";
// NOTE_TYPES constant, specifically for using NOTE_TYPES.BASIC.
import { NOTE_TYPES } from "../../../utils/constants.js";

/**
 * Tool definition for creating a new basic Anki flashcard.
 * Describes the tool's name, purpose, and input schema.
 * This tool specifically uses the 'Basic' Anki note type.
 */
export const createCardToolDefinition: Tool = {
  name: "create-card",
  description: "Create a new flashcard in a specified deck, with an optional hint (uses 'Basic' model).",
  inputSchema: {
    type: "object",
    properties: {
      deckName: {
        type: "string",
        description: "The name of the deck to add the card to",
      },
      front: {
        type: "string",
        description: "The front side of the card",
      },
      back: {
        type: "string",
        description: "The back side of the card",
      },
      hint: {
        type: "string",
        description: "Optional hint for the card",
      },
      tags: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Optional array of tags for the card",
      },
    },
    required: ["deckName", "front", "back"],
  },
};

/**
 * Handles the execution of the create-card tool.
 * It parses input arguments, prepares the fields for a 'Basic' Anki note,
 * calls the AnkiService to add the note, and returns a success response.
 * @param args - The arguments for the tool, expected to match CreateCardArgumentsSchema.
 * @param ankiService - An instance of AnkiService.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleCreateCard(
  args: unknown, // Input arguments are parsed by Zod.
  ankiService: AnkiService
): Promise<ToolResponse> {
  // Parse and validate arguments. Zod throws an error if validation fails.
  const { deckName, front, back, hint, tags = [] } = CreateCardArgumentsSchema.parse(args);

  // Prepare the fields for the Anki note.
  // For a 'Basic' note type, these are typically 'Front' and 'Back'.
  // A 'Hint' field is also common and supported here if provided.
  const fields: Record<string, string> = { Front: front, Back: back };
  if (hint) {
    fields.Hint = hint;
  }

  // Call the AnkiService to add the note, specifying the 'Basic' model type.
  // addNoteWithValidation will also check if the fields are valid for the model.
  const noteId = await ankiService.addNoteWithValidation({
    deckName,
    modelName: NOTE_TYPES.BASIC, // Explicitly use the 'Basic' note type.
    fields,
    tags,
  });

  // Return a success message including the new note's ID.
  return {
    content: [
      {
        type: "text",
        text: {
          text: `Successfully created Basic card in deck "${deckName}" with note ID: ${noteId}${
            hint ? " with a hint." : "."
          }`,
        },
      },
    ],
  };
}
