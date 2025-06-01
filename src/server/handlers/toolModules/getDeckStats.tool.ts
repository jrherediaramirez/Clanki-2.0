// src/server/handlers/toolModules/getDeckStats.tool.ts

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../../types/mcp.js";
import { AnkiService } from "../../../services/anki.js";
import { AnkiError } from "../../../utils/errors.js";
import { z } from "zod";
// You might need to define a type for the stats object in src/types/anki.ts
// e.g., interface AnkiDeckStats { totalCards: number; newCards: number; ... }

// Zod schema for input validation
const GetDeckStatsArgumentsSchema = z.object({
  deckName: z.string().min(1, "Deck name cannot be empty."),
});

export const getDeckStatsToolDefinition: Tool = {
  name: "get-deck-stats",
  description: "Retrieves statistics for a specified deck (e.g., total cards, new cards, due cards).",
  inputSchema: {
    type: "object",
    properties: {
      deckName: {
        type: "string",
        description: "The name of the deck (case-sensitive).",
      },
    },
    required: ["deckName"],
  },
};

export async function handleGetDeckStats(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  try {
    const { deckName } = GetDeckStatsArgumentsSchema.parse(args);

    // Assumes ankiService.getDeckStats method exists/will be created
    // This service method would call AnkiConnect's 'getDeckStats' action
    const stats = await ankiService.getDeckStats([deckName]); // AnkiConnect's getDeckStats takes an array of deck names

    if (!stats || !stats[deckName]) {
        throw new AnkiError(`Could not retrieve stats for deck "${deckName}".`);
    }
    
    const deckData = stats[deckName];
    // Format the stats into a string. Adjust based on the actual structure of 'deckData'
    const statsString = `Stats for deck "${deckName}":
    - Total Cards: ${deckData.total_in_deck !== undefined ? deckData.total_in_deck : (deckData.new_count + deckData.learn_count + deckData.review_count)}
    - New Cards: ${deckData.new_count}
    - Learning Cards: ${deckData.learn_count}
    - Due Cards (Reviews): ${deckData.review_count}
    (Note: Detailed stats may vary based on AnkiConnect version and deck configuration.)`;
    // The actual fields from AnkiConnect's getDeckStats are like:
    // deck_id, name, new_count, learn_count, review_count, total_in_deck etc.

    return {
      content: [
        {
          type: "text",
          text: { text: statsString },
        },
      ],
    };
  } catch (error: any) {
    console.error(`Error in handleGetDeckStats for deck:`, args, error);
     const errorMessage = error instanceof z.ZodError
      ? `Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      : error instanceof AnkiError
        ? error.message
        : "An unknown error occurred while trying to get deck stats.";
     return {
        content: [{
            type: "text",
            text: { text: `Error getting deck stats: ${errorMessage}` }
        }]
     };
  }
}