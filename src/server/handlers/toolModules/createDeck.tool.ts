// src/server/handlers/toolModules/createDeck.tool.ts

// Import necessary types and services
// The Tool type is used to define the structure of the tool for the MCP SDK.
import { Tool } from "@modelcontextprotocol/sdk/types.js";
// ToolResponse is the expected structure for the response after a tool is called.
import { ToolResponse } from "../../../types/mcp.js";
// AnkiService provides the methods to interact with the AnkiConnect API.
import { AnkiService } from "../../../services/anki.js";
// CreateDeckArgumentsSchema is the Zod schema for validating the input arguments for this tool.
import { CreateDeckArgumentsSchema } from "../../../services/validation.js";

/**
 * Tool definition for creating a new Anki deck.
 * This object describes the tool's name, its purpose, and the expected input schema.
 */
export const createDeckToolDefinition: Tool = {
  name: "create-deck",
  description: "Create a new Anki deck",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The name of the deck to create",
        minLength: 1
      }
    },
    required: ["name"]
  },
};

/**
 * Handles the execution of the create-deck tool.
 * It parses the input arguments, calls the AnkiService to create the deck,
 * and then returns a response indicating success.
 * @param args - The arguments for the tool, expected to match CreateDeckArgumentsSchema.
 * @param ankiService - An instance of AnkiService to interact with Anki.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleCreateDeck(
  args: unknown, // Arguments come in as 'unknown' and are parsed by Zod.
  ankiService: AnkiService
): Promise<ToolResponse> {
  // Parse and validate the input arguments using the Zod schema.
  // If validation fails, Zod will throw an error which should be caught by the central tool dispatcher.
  const { name: deckName } = CreateDeckArgumentsSchema.parse(args);

  // Call the AnkiService to perform the deck creation.
  await ankiService.createDeck(deckName);

  // Return a success message.
  // The ToolResponse structure includes a content array with text objects.
  return {
    content: [
      {
        type: "text",
        text: { text: `Successfully created new deck "${deckName}"` },
      },
    ],
  };
}
