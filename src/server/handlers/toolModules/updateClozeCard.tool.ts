// src/server/handlers/toolModules/updateClozeCard.tool.ts

// Import necessary types, services, and constants
// Tool type for defining the tool structure.
import { Tool } from "@modelcontextprotocol/sdk/types.js";
// ToolResponse for the expected output structure.
import { ToolResponse } from "../../../types/mcp.js";
// AnkiService for interacting with AnkiConnect.
import { AnkiService } from "../../../services/anki.js";
// UpdateClozeCardArgumentsSchema for validating input arguments.
import { UpdateClozeCardArgumentsSchema } from "../../../services/validation.js";
// AnkiError for custom error handling.
import { AnkiError } from "../../../utils/errors.js";
// NOTE_TYPES is used to check if the note being updated is indeed a Cloze note.
import { NOTE_TYPES } from "../../../utils/constants.js";


/**
 * Validates that the provided text for a cloze card contains the required cloze deletion syntax.
 * Throws an AnkiError if the syntax is missing.
 * This function is similar to the one in createClozeCard.tool.ts.
 * @param text - The text to validate.
 * @param fieldName - The name of the field being validated (e.g., "Text").
 */
function validateClozeText(text: string, fieldName: string = "Text"): void {
  if (!text || typeof text !== 'string' || !text.includes("{{c") || !text.includes("}}")) {
    throw new AnkiError(
      `Field "${fieldName}" for Cloze model must contain at least one cloze deletion using {{c1::text}} syntax. Received: "${text}"`
    );
  }
}

/**
 * Tool definition for updating an existing cloze deletion Anki card.
 * Describes the tool's name, purpose, and input schema.
 * It assumes the card being updated is of the 'Cloze' Anki note type.
 */
export const updateClozeCardToolDefinition: Tool = {
  name: "update-cloze-card",
  description: "Update an existing cloze deletion card (assumes 'Cloze' model structure).",
  inputSchema: {
    type: "object",
    properties: {
      noteId: {
        type: "number",
        description: "The ID of the note to update"
      },
      text: {
        type: "string",
        description: "The new text with cloze deletions using {{c1::text}} syntax (optional)"
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
    required: ["noteId"]
  },
};

/**
 * Handles the execution of the update-cloze-card tool.
 * It parses input arguments, validates new cloze text if provided,
 * updates the specified fields or tags of the 'Cloze' note,
 * and returns a success response.
 * @param args - The arguments for the tool, expected to match UpdateClozeCardArgumentsSchema.
 * @param ankiService - An instance of AnkiService.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleUpdateClozeCard(
  args: unknown, // Input arguments are parsed by Zod.
  ankiService: AnkiService
): Promise<ToolResponse> {
  // Parse and validate arguments. Zod throws an error if validation fails.
  const { noteId, text, backExtra, tags } = UpdateClozeCardArgumentsSchema.parse(args);

  // It's good practice to verify the note is actually a cloze note before updating.
  // This requires fetching note info, which adds an extra API call.
  // Depending on desired robustness vs. performance, this check can be optional.
  // For this example, we'll include it as it was in your original tools.ts logic.
  const noteInfoArray = await ankiService.getNotesInfo([noteId]);
  if (noteInfoArray.length === 0) {
    throw new AnkiError(`No note found with ID ${noteId}`);
  }
  if (noteInfoArray[0].modelName.toLowerCase() !== NOTE_TYPES.CLOZE.toLowerCase()) {
    // Check against lowercase to be more robust against potential casing differences in model names.
    throw new AnkiError(`Note ${noteId} is not a Cloze model note. It is a "${noteInfoArray[0].modelName}" model.`);
  }

  // Prepare an object to hold only the fields that are actually being updated.
  const fieldsToUpdate: Record<string, string> = {};

  if (text !== undefined) { // Check if 'text' was provided
    validateClozeText(text, "Text"); // Validate new cloze text
    fieldsToUpdate.Text = text;
  }

  if (backExtra !== undefined) { // Check if 'backExtra' was provided
    // Allow clearing the field by providing an empty string.
    fieldsToUpdate["Back Extra"] = backExtra;
  }

  // If there are any fields to update, call the AnkiService.
  if (Object.keys(fieldsToUpdate).length > 0) {
    await ankiService.updateNoteFields(noteId, fieldsToUpdate);
  }

  // If new tags are provided, replace the existing tags.
  if (tags !== undefined) { // Check if 'tags' array was provided
    await ankiService.replaceTags([noteId], tags);
  }

  // Return a success message.
  return {
    content: [
      {
        type: "text",
        text: { text: `Successfully updated cloze card with note ID: ${noteId}` },
      },
    ],
  };
}
