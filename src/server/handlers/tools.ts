// src/server/handlers/tools.ts (Refactored)

// Core SDK types and local project types/services
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../types/mcp.js";
import { AnkiService } from "../../services/anki.js";
import { AnkiError } from "../../utils/errors.js"; // For general error handling in the dispatcher

// Import all tool definitions and their corresponding handlers
// from the new modules located in the 'toolModules' directory.

// Deck operations
import { createDeckToolDefinition, handleCreateDeck } from "./toolModules/createDeck.tool.js";

// Basic card operations
import { createCardToolDefinition, handleCreateCard } from "./toolModules/createCard.tool.js";
import { updateCardToolDefinition, handleUpdateCard } from "./toolModules/updateCard.tool.js";

// Cloze card operations
import { createClozeCardToolDefinition, handleCreateClozeCard } from "./toolModules/createClozeCard.tool.js";
import { updateClozeCardToolDefinition, handleUpdateClozeCard } from "./toolModules/updateClozeCard.tool.js";

// Batch and dynamic card operations
import { createCardsBatchToolDefinition, handleCreateCardsBatch } from "./toolModules/createCardsBatch.tool.js";
import { createDynamicCardToolDefinition, handleCreateDynamicCard } from "./toolModules/createDynamicCard.tool.js";
import { smartCreateCardToolDefinition, handleSmartCardCreation } from "./toolModules/smartCreateCard.tool.js";

// Note and card management operations
import { deleteNoteToolDefinition, handleDeleteNote } from "./toolModules/deleteNote.tool.js";
import { queryCardsToolDefinition, handleQueryCards } from "./toolModules/queryCards.tool.js";

// Model (Note Type) operations
import { getModelNamesToolDefinition, handleGetModelNames } from "./toolModules/getModelNames.tool.js";
import { getModelInfoToolDefinition, handleGetModelInfo } from "./toolModules/getModelInfo.tool.js";

// Guidelines
import { getClankiOperationalGuidelinesToolDefinition, handleGetClankiOperationalGuidelines } from "./toolModules/getClankiOperationalGuidelines.tool.js";

// Re-export tool definitions (with alias) and handlers for index.ts
export { createDeckToolDefinition as createDeckTool, handleCreateDeck };
export { createCardToolDefinition as createCardTool, handleCreateCard };
export { updateCardToolDefinition as updateCardTool, handleUpdateCard };
export { createClozeCardToolDefinition as createClozeCardTool, handleCreateClozeCard };
export { updateClozeCardToolDefinition as updateClozeCardTool, handleUpdateClozeCard };
export { createCardsBatchToolDefinition as createCardsBatchTool, handleCreateCardsBatch };
export { createDynamicCardToolDefinition as createDynamicCardTool, handleCreateDynamicCard };
export { smartCreateCardToolDefinition as smartCreateCardTool, handleSmartCardCreation };
export { deleteNoteToolDefinition as deleteNoteTool, handleDeleteNote };
export { queryCardsToolDefinition as queryCardsTool, handleQueryCards };
export { getModelNamesToolDefinition as getModelNamesTool, handleGetModelNames };
export { getModelInfoToolDefinition as getModelInfoTool, handleGetModelInfo };
export { getClankiOperationalGuidelinesToolDefinition as getClankiOperationalGuidelinesTool, handleGetClankiOperationalGuidelines };


/**
 * Array containing all available tool definitions.
 * This array is used by the MCP server to announce the tools it supports.
 */
export const allTools: Tool[] = [
  createDeckToolDefinition,
  createCardToolDefinition,
  updateCardToolDefinition,
  createClozeCardToolDefinition,
  updateClozeCardToolDefinition,
  createCardsBatchToolDefinition,
  deleteNoteToolDefinition,
  queryCardsToolDefinition,
  getModelNamesToolDefinition,
  getModelInfoToolDefinition,
  createDynamicCardToolDefinition,
  smartCreateCardToolDefinition,
  getClankiOperationalGuidelinesToolDefinition,
  // Future tools will be added here by importing their definitions.
];

/**
 * Returns the list of all tool definitions.
 * This function is typically called by the MCP server during initialization
 * or when a client requests the list of available tools.
 */
export function getToolDefinitions(): { tools: Tool[] } {
  return { tools: allTools };
}

/**
 * Central dispatcher for handling tool calls.
 * It takes the tool name and arguments, finds the corresponding handler,
 * and executes it. It also includes centralized error handling.
 * @param name - The name of the tool to be called.
 * @param args - The arguments for the tool.
 * @param ankiService - An instance of AnkiService to be passed to the tool handlers.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleToolCall(
  name: string,
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  try {
    // The switch statement routes the call to the appropriate imported handler.
    switch (name) {
      // Deck
      case "create-deck":
        return await handleCreateDeck(args, ankiService);

      // Basic Card
      case "create-card":
        return await handleCreateCard(args, ankiService);
      case "update-card":
        return await handleUpdateCard(args, ankiService);

      // Cloze Card
      case "create-cloze-card":
        return await handleCreateClozeCard(args, ankiService);
      case "update-cloze-card":
        return await handleUpdateClozeCard(args, ankiService);

      // Batch & Dynamic
      case "create-cards-batch":
        return await handleCreateCardsBatch(args, ankiService);
      case "create-dynamic-card":
        return await handleCreateDynamicCard(args, ankiService);
      case "smart-create-card":
        return await handleSmartCardCreation(args, ankiService);

      // Management
      case "delete-note":
        return await handleDeleteNote(args, ankiService);
      case "query-cards":
        return await handleQueryCards(args, ankiService);

      // Model Info
      case "get-model-names":
        return await handleGetModelNames(args, ankiService);
      case "get-model-info":
        return await handleGetModelInfo(args, ankiService);

      // Guidelines
      case "get_clanki_operational_guidelines":
        return await handleGetClankiOperationalGuidelines(args, ankiService);

      default:
        // Handle cases where an unknown tool name is provided.
        console.error(`Unknown tool called: ${name}`);
        throw new AnkiError(`Unknown tool: ${name}. Please ensure the tool name is correct and supported.`);
    }
  } catch (error: any) {
    // Centralized error handling for issues during tool execution.
    // This includes Zod validation errors and custom AnkiErrors.
    console.error(`Error in handleToolCall for tool "${name}":`, error);

    if (error.name === 'ZodError') {
      // Format Zod validation errors for a more user-friendly message.
      const messages = error.errors.map((e: any) => {
        const path = e.path.join('.');
        return path ? `${path}: ${e.message}` : e.message; // Include path if available
      }).join('; ');
      return {
        content: [{
          type: "text",
          text: { text: `Invalid arguments for tool "${name}": ${messages}. Please check the input format.` }
        }]
      };
    }

    // For AnkiErrors or other standard errors, use their message.
    const errorMessage = error instanceof AnkiError || error instanceof Error
      ? error.message
      : "An unknown error occurred during tool execution.";

    return {
      content: [{
        type: "text",
        text: { text: `Tool execution error for "${name}": ${errorMessage}` }
      }]
    };
  }
}
