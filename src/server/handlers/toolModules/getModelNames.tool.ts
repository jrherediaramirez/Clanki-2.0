// src/server/handlers/toolModules/getModelNames.tool.ts

// Import necessary types and services
// Tool type for defining the tool structure.
import { Tool } from "@modelcontextprotocol/sdk/types.js";
// ToolResponse for the expected output structure.
import { ToolResponse } from "../../../types/mcp.js";
// AnkiService for interacting with AnkiConnect.
import { AnkiService } from "../../../services/anki.js";
// Zod is used here to define an empty object schema, as this tool takes no arguments.
import { z } from "zod";

/**
 * Tool definition for retrieving all available Anki note type/model names.
 * This tool does not require any input arguments.
 */
export const getModelNamesToolDefinition: Tool = {
  name: "get-model-names",
  description: "Get all available note types/models in the Anki collection.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  },
};

/**
 * Handles the execution of the get-model-names tool.
 * It calls the AnkiService to fetch the list of model names from Anki
 * and returns them in a formatted string.
 * @param args - The arguments for the tool (expected to be an empty object).
 * @param ankiService - An instance of AnkiService.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleGetModelNames(
  args: unknown, // Though no arguments are expected, we still validate it as an empty object.
  ankiService: AnkiService
): Promise<ToolResponse> {
  // Validate args against the empty schema. This is a good practice even for no-arg tools.
  z.object({}).parse(args);

  // Call the AnkiService to get the model names.
  const modelNames = await ankiService.getModelNames();

  // Format the response.
  const responseText = modelNames.length > 0
    ? `Available note types/models (${modelNames.length}):\n${modelNames.map(name => `• ${name}`).join('\n')}`
    : "No note types/models found in the Anki collection.";

  return {
    content: [
      {
        type: "text",
        text: { text: responseText },
      },
    ],
  };
}
