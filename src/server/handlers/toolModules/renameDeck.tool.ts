// src/server/handlers/toolModules/renameDeck.tool.ts

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../../types/mcp.js";
import { AnkiService } from "../../../services/anki.js";
import { AnkiError } from "../../../utils/errors.js";
import { z } from "zod";

// Zod schema for input validation
const RenameDeckArgumentsSchema = z.object({
  currentDeckName: z.string().min(1, "Current deck name cannot be empty."),
  newDeckName: z.string().min(1, "New deck name cannot be empty."),
});

export const renameDeckToolDefinition: Tool = {
  name: "rename-deck",
  description: "Renames an existing Anki deck. This involves moving all cards from the current deck to a new deck name and then deleting the original deck.",
  inputSchema: {
    type: "object",
    properties: {
      currentDeckName: {
        type: "string",
        description: "The current, case-sensitive name of the deck to rename.",
      },
      newDeckName: {
        type: "string",
        description: "The desired new, case-sensitive name for the deck.",
      },
    },
    required: ["currentDeckName", "newDeckName"],
  },
};

export async function handleRenameDeck(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  try {
    const { currentDeckName, newDeckName } = RenameDeckArgumentsSchema.parse(args);

    if (currentDeckName === newDeckName) {
      return {
        content: [{
          type: "text",
          text: { text: "Current deck name and new deck name are the same. No action taken." },
        }],
      };
    }

    // This method will need to be implemented in AnkiService
    await ankiService.renameDeck(currentDeckName, newDeckName);

    return {
      content: [
        {
          type: "text",
          text: { text: `Successfully renamed deck "${currentDeckName}" to "${newDeckName}".` },
        },
      ],
    };
  } catch (error: any) {
    console.error(`Error in handleRenameDeck from "${args}" to new name:`, error);
    const errorMessage = error instanceof z.ZodError
      ? `Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      : error instanceof AnkiError
        ? error.message
        : "An unknown error occurred while trying to rename the deck.";
    
     return {
        content: [{
            type: "text",
            text: { text: `Error renaming deck: ${errorMessage}` }
        }]
     };
  }
}