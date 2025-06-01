// src/server/handlers/toolModules/unsuspendCards.tool.ts

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../../types/mcp.js";
import { AnkiService } from "../../../services/anki.js";
import { AnkiError } from "../../../utils/errors.js";
import { z } from "zod";

// Zod schema for input validation
const UnsuspendCardsArgumentsSchema = z.object({
  cardIds: z.array(z.number().positive()).optional(),
  query: z.string().min(1).optional(),
}).refine(data => data.cardIds || data.query, {
  message: "Either 'cardIds' or a 'query' must be provided.",
});

export const unsuspendCardsToolDefinition: Tool = {
  name: "unsuspend-cards",
  description: "Unsuspends one or more Anki cards. Provide either specific card IDs or an Anki search query.",
  inputSchema: {
    type: "object",
    properties: {
      cardIds: {
        type: "array",
        items: { type: "number" },
        description: "An array of Card IDs to unsuspend.",
        optional: true,
      },
      query: {
        type: "string",
        description: "An Anki search query to select cards for unsuspension.",
        optional: true,
      },
    },
    // The actual requirement of one OR the other is handled by Zod's refine and handler logic.
  },
};

export async function handleUnsuspendCards(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  try {
    const parsedArgs = UnsuspendCardsArgumentsSchema.parse(args);
    let cardIdsToProcess: number[];

    if (parsedArgs.cardIds && parsedArgs.cardIds.length > 0) {
      cardIdsToProcess = parsedArgs.cardIds;
    } else if (parsedArgs.query) {
      // Assumes ankiService.findCards method exists/will be created
      cardIdsToProcess = await ankiService.findCards(parsedArgs.query);
      if (cardIdsToProcess.length === 0) {
        return { content: [{ type: "text", text: { text: `No cards found matching query "${parsedArgs.query}". No cards were unsuspended.` } }] };
      }
    } else {
      throw new AnkiError("Invalid arguments: Either 'cardIds' or 'query' must be provided for unsuspending cards.");
    }

    // Assumes ankiService.unsuspendCards method exists/will be created
    await ankiService.unsuspendCards(cardIdsToProcess);

    return {
      content: [
        {
          type: "text",
          text: { text: `Successfully requested unsuspension for ${cardIdsToProcess.length} card(s).` },
        },
      ],
    };
  } catch (error: any) {
    console.error(`Error in handleUnsuspendCards:`, args, error);
    const errorMessage = error instanceof z.ZodError
      ? `Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      : error instanceof AnkiError
        ? error.message
        : "An unknown error occurred while trying to unsuspend cards.";
    return {
        content: [{
            type: "text",
            text: { text: `Error unsuspending cards: ${errorMessage}` }
        }]
     };
  }
}