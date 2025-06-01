// Re-export individual tools
export { createDeckTool, handleCreateDeck } from "./deck.js";
export { 
  createCardTool, 
  updateCardTool, 
  handleCreateCard, 
  handleUpdateCard 
} from "./card.js";
export { 
  createClozeCardTool, 
  updateClozeCardTool, 
  handleCreateClozeCard, 
  handleUpdateClozeCard 
} from "./cloze.js";

// Import all tools to create the array
import { createDeckTool } from "./deck.js";
import { createCardTool, updateCardTool } from "./card.js";
import { createClozeCardTool, updateClozeCardTool } from "./cloze.js";

// Export all tool definitions for the MCP server
export const allTools = [
  createDeckTool,
  createCardTool,
  updateCardTool,
  createClozeCardTool,
  updateClozeCardTool,
];