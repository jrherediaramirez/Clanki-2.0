import { AnkiService } from "../services/anki.js";
import { CreateDeckArgumentsSchema } from "../services/validation.js";
import { ToolResponse } from "../types/mcp.js"; // This now refers to the updated ToolResponse

export const createDeckTool = {
  name: "create-deck",
  description: "Create a new Anki deck",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name for the new deck",
      },
    },
    required: ["name"],
  },
};

export async function handleCreateDeck(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  const { name: deckName } = CreateDeckArgumentsSchema.parse(args);
  
  await ankiService.createDeck(deckName);
  
  return {
    content: [
      {
        type: "text",
        text: { text: `Successfully created new deck "${deckName}"` }, // Updated this line
      },
    ],
  };
}