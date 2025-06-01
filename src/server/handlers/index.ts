// jrherediaramirez/clanki-2.0/Clanki-2.0-6b23594186d62acc58f666efd8a075e8fcf06b78/src/server/handlers/index.ts

// Export core functionalities and all tool definitions from tools.ts
export {
  getToolDefinitions, // Function that returns all tool definitions
  handleToolCall,     // Main function to delegate tool calls
  allTools            // Array of all tool definitions
} from "./tools.js";

// Export individual tool definitions and their handlers from tools.ts
// This allows for more granular imports if needed, and follows the pattern
// you had in your snippet.

// Original tools and handlers
export {
  createDeckTool,
  handleCreateDeck,
  createCardTool,
  handleCreateCard,
  updateCardTool,
  handleUpdateCard,
  createClozeCardTool,
  handleCreateClozeCard,
  updateClozeCardTool,
  handleUpdateClozeCard,
  createCardsBatchTool,
  handleCreateCardsBatch,
  deleteNoteTool,
  handleDeleteNote,
  queryCardsTool,
  handleQueryCards,
  getModelNamesTool,
  handleGetModelNames,
  getModelInfoTool,
  handleGetModelInfo,
  createDynamicCardTool,
  handleCreateDynamicCard,
  smartCreateCardTool,
  handleSmartCardCreation,
  getClankiOperationalGuidelinesTool,     // <-- New tool export
  handleGetClankiOperationalGuidelines  // <-- New handler export
} from "./tools.js";


// Export specific functions from resources.ts
export { listResources, readResource } from "./resources.js";