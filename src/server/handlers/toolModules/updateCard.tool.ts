// src/server/handlers/toolModules/updateCard.tool.ts

// Import necessary types and services
// Tool type for defining the tool structure.
import { Tool } from "@modelcontextprotocol/sdk/types.js";
// ToolResponse for the expected output structure.
import { ToolResponse } from "../../../types/mcp.js";
// AnkiService for interacting with AnkiConnect.
import { AnkiService } from "../../../services/anki.js";
// UpdateCardArgumentsSchema for validating input arguments.
import { UpdateCardArgumentsSchema } from "../../../services/validation.js";

/**
 * Tool definition for updating an existing Anki flashcard.
 * This tool assumes a 'Basic' or similar model structure where 'Front' and 'Back' fields exist.
 * It identifies the note to update by its unique Note ID.
 */
export const updateCardToolDefinition: Tool = {
  name: "update-card",
  description: "Update an existing flashcard (assumes 'Basic' or similar model structure).",
  inputSchema: {
    type: "object",
    properties: {
      noteId: {
        type: "number",
        description: "The ID of the note to update"
      },
      front: {
        type: "string",
        description: "The new front side of the card (optional)"
      },
      back: {
        type: "string", 
        description: "The new back side of the card (optional)"
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
 * Handles the execution of the update-card tool.
 * It parses input arguments, determines which fields or tags to update,
 * calls the AnkiService to perform the updates, and returns a success response.
 * @param args - The arguments for the tool, expected to match UpdateCardArgumentsSchema.
 * @param ankiService - An instance of AnkiService.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleUpdateCard(
  args: unknown, // Input arguments are parsed by Zod.
  ankiService: AnkiService
): Promise<ToolResponse> {
  // Parse and validate arguments. Zod throws an error if validation fails.
  const { noteId, front, back, tags } = UpdateCardArgumentsSchema.parse(args);

  // Prepare an object to hold only the fields that are actually being updated.
  const fieldsToUpdate: Record<string, string> = {};
  if (front !== undefined) { // Check if 'front' was provided in the arguments
    fieldsToUpdate.Front = front;
  }
  if (back !== undefined) { // Check if 'back' was provided
    fieldsToUpdate.Back = back;
  }

  // If there are any fields to update (Front or Back), call the AnkiService.
  if (Object.keys(fieldsToUpdate).length > 0) {
    await ankiService.updateNoteFields(noteId, fieldsToUpdate);
  }

  // If new tags are provided, call the AnkiService to replace the existing tags.
  // AnkiConnect's replaceTags action replaces all existing tags with the new set.
  if (tags !== undefined) { // Check if 'tags' array was provided
    await ankiService.replaceTags([noteId], tags);
  }

  // Return a success message.
  return {
    content: [
      {
        type: "text",
        text: { text: `Successfully updated card with note ID: ${noteId}` },
      },
    ],
  };
}
