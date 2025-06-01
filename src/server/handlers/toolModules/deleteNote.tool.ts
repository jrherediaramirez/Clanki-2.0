// src/server/handlers/toolModules/deleteNote.tool.ts

// Import necessary types and services
// Tool type for defining the tool structure.
import { Tool } from "@modelcontextprotocol/sdk/types.js";
// ToolResponse for the expected output structure.
import { ToolResponse } from "../../../types/mcp.js";
// AnkiService for interacting with AnkiConnect.
import { AnkiService } from "../../../services/anki.js";
// DeleteNoteArgumentsSchema for validating input arguments.
import { DeleteNoteArgumentsSchema } from "../../../services/validation.js";

/**
 * Tool definition for deleting one or more Anki notes by their IDs.
 * Deleting a note also deletes all of its associated cards.
 */
export const deleteNoteToolDefinition: Tool = {
  name: "delete-note",
  description: "Delete one or more Anki notes by their IDs.",
  inputSchema: {
    type: "object",
    properties: {
      noteIds: {
        type: "array",
        items: {
          type: "number"
        },
        description: "Array of note IDs to delete",
        minItems: 1
      }
    },
    required: ["noteIds"]
  },
};

/**
 * Handles the execution of the delete-note tool.
 * It parses an array of note IDs, calls the AnkiService to delete these notes,
 * and returns a response indicating the action was requested.
 * @param args - The arguments for the tool, expected to match DeleteNoteArgumentsSchema.
 * @param ankiService - An instance of AnkiService.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleDeleteNote(
  args: unknown, // Input arguments are parsed by Zod.
  ankiService: AnkiService
): Promise<ToolResponse> {
  // Parse and validate arguments. Zod throws an error if validation fails.
  const { noteIds } = DeleteNoteArgumentsSchema.parse(args);

  // Call the AnkiService to perform the note deletion.
  // The AnkiService's deleteNotes method handles the AnkiConnect call.
  // AnkiConnect's "deleteNotes" action typically returns null on success.
  await ankiService.deleteNotes(noteIds);

  // Return a message indicating that the deletion was requested.
  // It's good to remind the user to confirm in Anki, as the deletion is permanent.
  return {
    content: [
      {
        type: "text",
        text: {
          text: `Successfully requested deletion for Note ID(s): ${noteIds.join(", ")}. Please check Anki to confirm, as this action is permanent.`,
        },
      },
    ],
  };
}
