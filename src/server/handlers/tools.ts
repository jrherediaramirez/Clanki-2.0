// src/server/handlers/tools.ts (Recreated and Updated)

// Core SDK types and local project types/services
import { Tool } from "@modelcontextprotocol/sdk/types.js"; //
import { ToolResponse } from "../../types/mcp.js"; //
import { AnkiService } from "../../services/anki.js"; //
import { AnkiError } from "../../utils/errors.js"; //

// Import all tool definitions and their corresponding handlers
// from the 'toolModules' directory.

// --- Deck Operations ---
import { createDeckToolDefinition, handleCreateDeck } from "./toolModules/createDeck.tool.js"; //
// NEW: Import for delete-deck
import { deleteDeckToolDefinition, handleDeleteDeck } from "./toolModules/deleteDeck.tool.js";
// NEW: Import for get-deck-stats
import { getDeckStatsToolDefinition, handleGetDeckStats } from "./toolModules/getDeckStats.tool.js";
// NEW: Import for rename-deck
import { renameDeckToolDefinition, handleRenameDeck } from "./toolModules/renameDeck.tool.js";

// --- Basic Card Operations ---
import { createCardToolDefinition, handleCreateCard } from "./toolModules/createCard.tool.js"; //
import { updateCardToolDefinition, handleUpdateCard } from "./toolModules/updateCard.tool.js"; //

// --- Cloze Card Operations ---
import { createClozeCardToolDefinition, handleCreateClozeCard } from "./toolModules/createClozeCard.tool.js"; //
import { updateClozeCardToolDefinition, handleUpdateClozeCard } from "./toolModules/updateClozeCard.tool.js"; //

// --- Batch and Dynamic Card Operations ---
import { createCardsBatchToolDefinition, handleCreateCardsBatch } from "./toolModules/createCardsBatch.tool.js"; //
import { createDynamicCardToolDefinition, handleCreateDynamicCard } from "./toolModules/createDynamicCard.tool.js"; //
import { smartCreateCardToolDefinition, handleSmartCardCreation } from "./toolModules/smartCreateCard.tool.js"; //

// --- Note and Card Management/Query Operations ---
import { deleteNoteToolDefinition, handleDeleteNote } from "./toolModules/deleteNote.tool.js"; //
import { queryCardsToolDefinition, handleQueryCards } from "./toolModules/queryCards.tool.js"; //
// NEW: Import for get-card-info
import { getCardInfoToolDefinition, handleGetCardInfo } from "./toolModules/getCardInfo.tool.js";
// NEW: Import for suspend-cards
import { suspendCardsToolDefinition, handleSuspendCards } from "./toolModules/suspendCards.tool.js";
// NEW: Import for unsuspend-cards
import { unsuspendCardsToolDefinition, handleUnsuspendCards } from "./toolModules/unsuspendCards.tool.js";

// --- Model (Note Type) Operations ---
import { getModelNamesToolDefinition, handleGetModelNames } from "./toolModules/getModelNames.tool.js"; //
import { getModelInfoToolDefinition, handleGetModelInfo } from "./toolModules/getModelInfo.tool.js"; //

// --- Clanki Operational Guidelines ---
import { getClankiOperationalGuidelinesToolDefinition, handleGetClankiOperationalGuidelines } from "./toolModules/getClankiOperationalGuidelines.tool.js"; //

// Re-export tool definitions (with alias) and handlers for index.ts
// Deck
export { createDeckToolDefinition as createDeckTool, handleCreateDeck }; //
export { deleteDeckToolDefinition as deleteDeckTool, handleDeleteDeck };
export { getDeckStatsToolDefinition as getDeckStatsTool, handleGetDeckStats };
export { renameDeckToolDefinition as renameDeckTool, handleRenameDeck };
// Basic Card
export { createCardToolDefinition as createCardTool, handleCreateCard }; //
export { updateCardToolDefinition as updateCardTool, handleUpdateCard }; //
// Cloze Card
export { createClozeCardToolDefinition as createClozeCardTool, handleCreateClozeCard }; //
export { updateClozeCardToolDefinition as updateClozeCardTool, handleUpdateClozeCard }; //
// Batch & Dynamic
export { createCardsBatchToolDefinition as createCardsBatchTool, handleCreateCardsBatch }; //
export { createDynamicCardToolDefinition as createDynamicCardTool, handleCreateDynamicCard }; //
export { smartCreateCardToolDefinition as smartCreateCardTool, handleSmartCardCreation }; //
// Management & Query
export { deleteNoteToolDefinition as deleteNoteTool, handleDeleteNote }; //
export { queryCardsToolDefinition as queryCardsTool, handleQueryCards }; //
export { getCardInfoToolDefinition as getCardInfoTool, handleGetCardInfo };
export { suspendCardsToolDefinition as suspendCardsTool, handleSuspendCards };
export { unsuspendCardsToolDefinition as unsuspendCardsTool, handleUnsuspendCards };
// Model Info
export { getModelNamesToolDefinition as getModelNamesTool, handleGetModelNames }; //
export { getModelInfoToolDefinition as getModelInfoTool, handleGetModelInfo }; //
// Guidelines
export { getClankiOperationalGuidelinesToolDefinition as getClankiOperationalGuidelinesTool, handleGetClankiOperationalGuidelines }; //


/**
 * Array containing all available tool definitions.
 * This array is used by the MCP server to announce the tools it supports.
 */
export const allTools: Tool[] = [
  // Deck Operations
  createDeckToolDefinition, //
  deleteDeckToolDefinition,
  getDeckStatsToolDefinition,
  renameDeckToolDefinition,

  // Basic Card Operations
  createCardToolDefinition, //
  updateCardToolDefinition, //

  // Cloze Card Operations
  createClozeCardToolDefinition, //
  updateClozeCardToolDefinition, //

  // Batch and Dynamic Card Operations
  createCardsBatchToolDefinition, //
  createDynamicCardToolDefinition, //
  smartCreateCardToolDefinition, //

  // Note and Card Management/Query Operations
  deleteNoteToolDefinition, //
  queryCardsToolDefinition, //
  getCardInfoToolDefinition,
  suspendCardsToolDefinition,
  unsuspendCardsToolDefinition,

  // Model (Note Type) Operations
  getModelNamesToolDefinition, //
  getModelInfoToolDefinition, //

  // Clanki Operational Guidelines
  getClankiOperationalGuidelinesToolDefinition, //
];

/**
 * Returns the list of all tool definitions.
 * This function is typically called by the MCP server during initialization
 * or when a client requests the list of available tools.
 */
export function getToolDefinitions(): { tools: Tool[] } { //
  return { tools: allTools }; //
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
export async function handleToolCall( //
  name: string, //
  args: unknown, //
  ankiService: AnkiService //
): Promise<ToolResponse> { //
  try {
    // The switch statement routes the call to the appropriate imported handler.
    switch (name) { //      // --- Deck Operations ---
      case "create-deck": //
        return await handleCreateDeck(args, ankiService); //
      case "delete-deck":
        return await handleDeleteDeck(args, ankiService);
      case "get-deck-stats":
        return await handleGetDeckStats(args, ankiService);
      case "rename-deck":
        return await handleRenameDeck(args, ankiService);

      // --- Basic Card Operations ---
      case "create-card": //
        return await handleCreateCard(args, ankiService); //
      case "update-card": //
        return await handleUpdateCard(args, ankiService); //

      // --- Cloze Card Operations ---
      case "create-cloze-card": //
        return await handleCreateClozeCard(args, ankiService); //
      case "update-cloze-card": //
        return await handleUpdateClozeCard(args, ankiService); //

      // --- Batch & Dynamic Card Operations ---
      case "create-cards-batch": //
        return await handleCreateCardsBatch(args, ankiService); //
      case "create-dynamic-card": //
        return await handleCreateDynamicCard(args, ankiService); //
      case "smart-create-card": //
        return await handleSmartCardCreation(args, ankiService); //

      // --- Note and Card Management/Query Operations ---
      case "delete-note": //
        return await handleDeleteNote(args, ankiService); //
      case "query-cards": //
        return await handleQueryCards(args, ankiService); //
      case "get-card-info":
        return await handleGetCardInfo(args, ankiService);
      case "suspend-cards":
        return await handleSuspendCards(args, ankiService);
      case "unsuspend-cards":
        return await handleUnsuspendCards(args, ankiService);

      // --- Model (Note Type) Operations ---
      case "get-model-names": //
        return await handleGetModelNames(args, ankiService); //
      case "get-model-info": //
        return await handleGetModelInfo(args, ankiService); //

      // --- Clanki Operational Guidelines ---
      case "get_clanki_operational_guidelines": //
        return await handleGetClankiOperationalGuidelines(args, ankiService); //

      default:
        // Handle cases where an unknown tool name is provided.
        console.error(`Unknown tool called: ${name}`); //
        throw new AnkiError(`Unknown tool: ${name}. Please ensure the tool name is correct and supported.`); //
    }
  } catch (error: any) { //
    // Centralized error handling for issues during tool execution.
    // This includes Zod validation errors and custom AnkiErrors.
    console.error(`Error in handleToolCall for tool "${name}":`, error); //

    if (error.name === 'ZodError') { //
      // Format Zod validation errors for a more user-friendly message.
      const messages = error.errors.map((e: any) => { //
        const path = e.path.join('.'); //
        return path ? `${path}: ${e.message}` : e.message; //
      }).join('; '); //
      return { //
        content: [{ //
          type: "text", //
          text: { text: `Invalid arguments for tool "${name}": ${messages}. Please check the input format.` } //
        }]
      };
    }

    // For AnkiErrors or other standard errors, use their message.
    const errorMessage = error instanceof AnkiError || error instanceof Error //
      ? error.message //
      : "An unknown error occurred during tool execution."; //

    return { //
      content: [{ //
        type: "text", //
        text: { text: `Tool execution error for "${name}": ${errorMessage}` } //
      }]
    };
  }
}