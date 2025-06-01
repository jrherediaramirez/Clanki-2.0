// src/server/handlers/toolModules/getClankiOperationalGuidelines.tool.ts

// Import necessary types
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../../types/mcp.js";
import { z } from "zod"; // For defining an empty input schema

// Import the guidelines text from its new central location.
// IMPORTANT: You will need to create this file and move the
// CLANKI_OPERATIONAL_GUIDELINES_TEXT constant into it.
import { CLANKI_OPERATIONAL_GUIDELINES_TEXT } from "../../../utils/guidelines.js";
// Alternatively, if you place it in constants.ts:
// import { CLANKI_OPERATIONAL_GUIDELINES_TEXT } from "../../../utils/constants.js";

/**
 * Tool definition for retrieving the Clanki operational guidelines.
 * These guidelines are intended to instruct an AI assistant on how to best use the Clanki tools.
 */
export const getClankiOperationalGuidelinesToolDefinition: Tool = {
  name: "get_clanki_operational_guidelines",
  description: "Returns a pre-defined set of operational guidelines (a system prompt) for an AI assistant to effectively use Clanki 2.0 tools.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  },
};

/**
 * Handles the execution of the get_clanki_operational_guidelines tool.
 * It simply returns the predefined CLANKI_OPERATIONAL_GUIDELINES_TEXT.
 * @param args - The arguments for the tool (expected to be an empty object).
 * @param ankiService - An instance of AnkiService (not used by this handler but part of the standard signature).
 * @returns A Promise resolving to a ToolResponse containing the guidelines text.
 */
export async function handleGetClankiOperationalGuidelines(
  args: unknown, // Expected to be an empty object, validated by the schema.
  // ankiService is part of the standard handler signature but not used here.
  // You can add a lint ignore if your linter complains about unused parameters.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ankiService: any // Using 'any' to avoid AnkiService import if truly unused.
                  // Or import AnkiService and add // @ts-ignore or eslint-disable-next-line
): Promise<ToolResponse> {
  // Validate args against the empty schema.
  z.object({}).parse(args);

  // Return the predefined guidelines text.
  return {
    content: [{
      type: "text",
      text: { text: CLANKI_OPERATIONAL_GUIDELINES_TEXT }
    }],
  };
}
