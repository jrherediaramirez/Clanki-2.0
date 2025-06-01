// src/server/handlers/toolModules/getCardInfo.tool.ts

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../../types/mcp.js";
import { AnkiService } from "../../../services/anki.js";
import { AnkiError } from "../../../utils/errors.js";
import { z } from "zod";
import { AnkiCardInfo } from "../../../types/anki.js"; // Ensure AnkiCardInfo is imported

// Zod schema for input validation
const GetCardInfoArgumentsSchema = z.object({
  cardIds: z.array(z.number().positive("Card ID must be a positive number.")).min(1, "At least one Card ID must be provided."),
});

export const getCardInfoToolDefinition: Tool = {
  name: "get-card-info",
  description: "Fetches detailed information about specific Anki cards (identified by their Card IDs), including scheduling info.",
  inputSchema: {
    type: "object",
    properties: {
      cardIds: {
        type: "array",
        items: {
          type: "number",
        },
        description: "An array of Card IDs to retrieve information for.",
      },
    },
    required: ["cardIds"],
  },
};

export async function handleGetCardInfo(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  try {
    const { cardIds } = GetCardInfoArgumentsSchema.parse(args);

    const cardsInfo: AnkiCardInfo[] = await ankiService.getCardsInfo(cardIds);

    if (!cardsInfo || cardsInfo.length === 0) {
      return {
        content: [{ type: "text", text: { text: "No information found for the provided card ID(s)." } }],
      };
    }

    // Format the card information
    const formattedInfo = cardsInfo.map(card => {
      // Using direct 'question' and 'answer' fields from AnkiCardInfo
      // and checking other fields for undefined before trying to display them.
      return `Card ID: ${card.cardId}
  Note ID: ${card.noteId}
  Deck: ${card.deckName}
  Model: ${card.modelName}
  Question: ${card.question || 'N/A'}
  Answer: ${card.answer || 'N/A'}
  Interval: ${card.interval !== undefined ? card.interval + " days" : 'N/A'}
  Due: ${card.due} (Note: Interpretation depends on card type/queue. For reviews, it's often days since creation or a specific date for learning cards)
  Lapses: ${card.lapses !== undefined ? card.lapses : 'N/A'}
  Reviews: ${card.reviews !== undefined ? card.reviews : 'N/A'}
  Factor: ${card.factor !== undefined ? card.factor : 'N/A'}
  Type: ${card.type !== undefined ? card.type : 'N/A'} (0=new, 1=learn, 2=review, 3=relearn)
  Queue: ${card.queue !== undefined ? card.queue : 'N/A'} (-3=user buried, -2=suspended, -1=scheduler buried, 0=new, 1=learn, 2=review, 3=day learn, 4=preview)
  Tags: ${card.tags.join(", ") || "No tags"}
  ---`;
    }).join("\n");

    return {
      content: [
        {
          type: "text",
          text: { text: `Detailed Card Information:\n${formattedInfo}` },
        },
      ],
    };
  } catch (error: any) {
    console.error(`Error in handleGetCardInfo:`, args, error);
    const errorMessage = error instanceof z.ZodError
      ? `Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      : error instanceof AnkiError
        ? error.message
        : "An unknown error occurred while trying to get card info.";
    return {
        content: [{
            type: "text",
            text: { text: `Error getting card info: ${errorMessage}` }
        }]
     };
  }
}