// src/server/handlers/toolModules/suspendCards.tool.ts

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../../types/mcp.js";
import { AnkiService } from "../../../services/anki.js";
import { AnkiError } from "../../../utils/errors.js";
import { z } from "zod";

// Zod schema for input validation
const SuspendCardsArgumentsSchema = z.object({
  cardIds: z.array(z.number().positive()).optional(),
  query: z.string().min(1).optional(),
}).refine(data => data.cardIds || data.query, {
  message: "Either 'cardIds' or a 'query' must be provided.",
});

export const suspendCardsToolDefinition: Tool = {
  name: "suspend-cards",
  description: "Suspends one or more Anki cards. Provide either specific card IDs or an Anki search query.",
  inputSchema: {
    type: "object",
    properties: {
      cardIds: {
        type: "array",
        items: { type: "number" },
        description: "An array of Card IDs to suspend.",
        optional: true,
      },
      query: {
        type: "string",
        description: "An Anki search query to select cards for suspension (e.g., 'tag:difficult deck:\"Medical Finals\"').",
        optional: true,
      },
    },
    // The actual requirement of one OR the other is handled by Zod's refine and handler logic.
  },
};

export async function handleSuspendCards(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  try {
    const parsedArgs = SuspendCardsArgumentsSchema.parse(args);
    let cardIdsToProcess: number[];

    if (parsedArgs.cardIds && parsedArgs.cardIds.length > 0) {
      cardIdsToProcess = parsedArgs.cardIds;
    } else if (parsedArgs.query) {
      // Assumes ankiService.findCards method exists/will be created
      cardIdsToProcess = await ankiService.findCards(parsedArgs.query);
      if (cardIdsToProcess.length === 0) {
        return { content: [{ type: "text", text: { text: `No cards found matching query "${parsedArgs.query}". No cards were suspended.` } }] };
      }
    } else {
      // Should be caught by Zod, but as a safeguard:
      throw new AnkiError("Invalid arguments: Either 'cardIds' or 'query' must be provided for suspending cards.");
    }

    // Assumes ankiService.suspendCards method exists/will be created
    await ankiService.suspendCards(cardIdsToProcess);

    return {
      content: [
        {
          type: "text",
          text: { text: `Successfully requested suspension for ${cardIdsToProcess.length} card(s).` },
        },
      ],
    };
  } catch (error: any) {
    console.error(`Error in handleSuspendCards:`, args, error);
    const errorMessage = error instanceof z.ZodError
      ? `Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      : error instanceof AnkiError
        ? error.message
        : "An unknown error occurred while trying to suspend cards.";
     return {
        content: [{
            type: "text",
            text: { text: `Error suspending cards: ${errorMessage}` }
        }]
     };
  }
}