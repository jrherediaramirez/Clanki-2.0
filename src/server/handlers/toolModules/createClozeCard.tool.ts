// src/server/handlers/toolModules/createClozeCard.tool.ts

// Import necessary types, services, and constants
// Tool type for defining the tool structure.
import { Tool } from "@modelcontextprotocol/sdk/types.js";
// ToolResponse for the expected output structure.
import { ToolResponse } from "../../../types/mcp.js";
// AnkiService for interacting with AnkiConnect.
import { AnkiService } from "../../../services/anki.js";
// CreateClozeCardArgumentsSchema for validating input arguments.
import { CreateClozeCardArgumentsSchema } from "../../../services/validation.js";
// NOTE_TYPES constant, specifically for using NOTE_TYPES.CLOZE.
import { NOTE_TYPES } from "../../../utils/constants.js";
// AnkiError for custom error handling.
import { AnkiError } from "../../../utils/errors.js";

/**
 * Validates that the provided text for a cloze card contains the required cloze deletion syntax.
 * Throws an AnkiError if the syntax is missing.
 * @param text - The text to validate.
 * @param fieldName - The name of the field being validated (e.g., "Text", "Front").
 */
function validateClozeText(text: string, fieldName: string = "Text"): void {
  // Check if the text is a string and contains the cloze markers.
  if (!text || typeof text !== 'string' || !text.includes("{{c") || !text.includes("}}")) {
    throw new AnkiError(
      `Field "${fieldName}" for Cloze model must contain at least one cloze deletion using {{c1::text}} syntax. Received: "${text}"`
    );
  }
}

/**
 * Tool definition for creating a new cloze deletion Anki card.
 * Describes the tool's name, purpose, and input schema.
 * This tool specifically uses the 'Cloze' Anki note type.
 */
export const createClozeCardToolDefinition: Tool = {
  name: "create-cloze-card",
  description: "Create a new cloze deletion card in a specified deck (uses 'Cloze' model). Use {{c1::text}} syntax for cloze deletions.",
  inputSchema: {
    type: "object",
    properties: {
      deckName: {
        type: "string",
        description: "The name of the deck to add the card to"
      },
      text: {
        type: "string",
        description: "The text with cloze deletions using {{c1::text}} syntax"
      },
      backExtra: {
        type: "string",
        description: "Optional extra information for the back of the card"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Optional array of tags for the card"
      }
    },
    required: ["deckName", "text"]
  },
};

/**
 * Handles the execution of the create-cloze-card tool.
 * It parses input arguments, validates the cloze text, prepares the fields for a 'Cloze' Anki note,
 * calls the AnkiService to add the note, and returns a success response.
 * @param args - The arguments for the tool, expected to match CreateClozeCardArgumentsSchema.
 * @param ankiService - An instance of AnkiService.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleCreateClozeCard(
  args: unknown, // Input arguments are parsed by Zod.
  ankiService: AnkiService
): Promise<ToolResponse> {
  // Parse and validate arguments. Zod throws an error if validation fails.
  const { deckName, text, backExtra = "", tags = [] } = CreateClozeCardArgumentsSchema.parse(args);

  // Validate the main cloze text.
  validateClozeText(text, "Text");

  // Prepare the fields for the Anki note.
  // For a 'Cloze' note type, these are typically 'Text' and 'Back Extra'.
  const fields: Record<string, string> = { Text: text };
  if (backExtra) { // Only add 'Back Extra' if it's provided and not an empty string.
    fields["Back Extra"] = backExtra;
  }

  // Call the AnkiService to add the note, specifying the 'Cloze' model type.
  // addNoteWithValidation will also check if the fields are valid for the model.
  const noteId = await ankiService.addNoteWithValidation({
    deckName,
    modelName: NOTE_TYPES.CLOZE, // Explicitly use the 'Cloze' note type.
    fields,
    tags,
  });

  // Return a success message including the new note's ID.
  return {
    content: [
      {
        type: "text",
        text: {
          text: `Successfully created Cloze card in deck "${deckName}" with note ID: ${noteId}`,
        },
      },
    ],
  };
}
