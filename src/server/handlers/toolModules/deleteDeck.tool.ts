// src/server/handlers/toolModules/deleteDeck.tool.ts

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../../types/mcp.js";
import { AnkiService } from "../../../services/anki.js";
import { AnkiError } from "../../../utils/errors.js";
import { z } from "zod";

// Zod schema for input validation
const DeleteDeckArgumentsSchema = z.object({
  deckName: z.string().min(1, "Deck name cannot be empty."),
});

export const deleteDeckToolDefinition: Tool = {
  name: "delete-deck",
  description: "Permanently deletes an Anki deck and all its cards. This action is irreversible.",
  inputSchema: {
    type: "object",
    properties: {
      deckName: {
        type: "string",
        description: "The case-sensitive name of the deck to delete.",
      },
    },
    required: ["deckName"],
  },
};

export async function handleDeleteDeck(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  try {
    const { deckName } = DeleteDeckArgumentsSchema.parse(args);

    // AnkiConnect's deleteDecks action expects an array of deck names.
    await ankiService.deleteDecks([deckName]); // Assumes ankiService.deleteDecks method exists/will be created

    return {
      content: [
        {
          type: "text",
          text: { text: `Successfully requested deletion for deck "${deckName}". This action is irreversible.` },
        },
      ],
    };
  } catch (error: any) {
    console.error(`Error in handleDeleteDeck for deck:`, args, error);
    const errorMessage = error instanceof z.ZodError
      ? `Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      : error instanceof AnkiError
        ? error.message
        : "An unknown error occurred while trying to delete the deck.";
    
    // It's good practice to throw the error if it's not handled specifically for a user-facing message
    // throw new AnkiError(`Failed to delete deck: ${errorMessage}`);
    // Or return it in the ToolResponse
     return {
        content: [{
            type: "text",
            text: { text: `Error deleting deck: ${errorMessage}` }
        }]
     };
  }
}