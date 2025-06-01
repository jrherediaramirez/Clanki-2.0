import { AnkiService } from "../../services/anki.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../types/mcp.js"; // Uses the updated ToolResponse { text: {text: string}}
import { AnkiError } from "../../utils/errors.js";
import {
  CreateDeckArgumentsSchema,
  CreateCardArgumentsSchema,
  UpdateCardArgumentsSchema,
  CreateClozeCardArgumentsSchema,
  UpdateClozeCardArgumentsSchema,
  DeleteNoteArgumentsSchema,
  QueryCardsArgumentsSchema,
    DeleteDeckArgumentsSchema,
  GetDeckStatsArgumentsSchema,
  SuspendCardsArgumentsSchema,
  UnsuspendCardsArgumentsSchema,
  GetCardInfoArgumentsSchema,
} from "../../services/validation.js";
import { NOTE_TYPES } from "../../utils/constants.js";
import { AnkiNoteInfo } from "../../types/anki.js";

// Tool Definitions (All inputSchemas are now fully defined)

export const createDeckTool: Tool = {
  name: "create-deck",
  description: "Create a new Anki deck",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name for the new deck",
        minLength: 1,
      },
    },
    required: ["name"],
  },
};

export const createCardTool: Tool = {
  name: "create-card",
  description: "Create a new flashcard in a specified deck, with an optional hint.",
  inputSchema: {
    type: "object",
    properties: {
      deckName: { type: "string", description: "Name of the deck to add the card to" },
      front: { type: "string", description: "Front side content of the card" },
      back: { type: "string", description: "Back side content of the card" },
      hint: { type: "string", description: "Optional hint for the card (ensure your Anki note type has a 'Hint' field)" },
      tags: { type: "array", items: { type: "string" }, description: "Optional tags for the card" },
    },
    required: ["deckName", "front", "back"],
  },
};

export const updateCardTool: Tool = {
  name: "update-card",
  description: "Update an existing flashcard",
  inputSchema: {
    type: "object",
    properties: {
      noteId: { type: "number", description: "ID of the note to update" },
      front: { type: "string", description: "New front side content" },
      back: { type: "string", description: "New back side content" },
      tags: { type: "array", items: { type: "string" }, description: "New tags for the card" },
    },
    required: ["noteId"],
  },
};

export const createClozeCardTool: Tool = {
  name: "create-cloze-card",
  description: "Create a new cloze deletion card in a specified deck. Use {{c1::text}} syntax for cloze deletions.",
  inputSchema: {
    type: "object",
    properties: {
      deckName: { type: "string", description: "Name of the deck to add the card to" },
      text: { type: "string", description: "Text containing cloze deletions using {{c1::text}} syntax" },
      backExtra: { type: "string", description: "Optional extra information to show on the back of the card" },
      tags: { type: "array", items: { type: "string" }, description: "Optional tags for the card" },
    },
    required: ["deckName", "text"],
  },
};

export const updateClozeCardTool: Tool = {
  name: "update-cloze-card",
  description: "Update an existing cloze deletion card",
  inputSchema: {
    type: "object",
    properties: {
      noteId: { type: "number", description: "ID of the note to update" },
      text: { type: "string", description: "New text with cloze deletions using {{c1::text}} syntax" },
      backExtra: { type: "string", description: "New extra information to show on the back of the card" },
      tags: { type: "array", items: { type: "string" }, description: "New tags for the card" },
    },
    required: ["noteId"],
  },
};

export const createCardsBatchTool: Tool = {
  name: "create-cards-batch",
  description: "Create multiple flashcards (basic or cloze) in a single batch operation.",
  inputSchema: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        description: "An array of card objects to create.",
        minItems: 1, // Assuming a batch should not be empty
        items: {
          type: "object",
          properties: {
            deckName: { type: "string", description: "Name of the deck for this card." },
            cardType: { type: "string", enum: ["basic", "cloze"], description: "Type of card: 'basic' or 'cloze'." },
            front: { type: "string", description: "Front content (required for 'basic' cardType)." },
            back: { type: "string", description: "Back content (required for 'basic' cardType)." },
            hint: { type: "string", description: "Optional hint (for 'basic' cardType with a 'Hint' field in Anki note type)." },
            text: { type: "string", description: "Text with cloze deletions using {{c1::text}} syntax (required for 'cloze' cardType)." },
            backExtra: { type: "string", description: "Optional extra information for the back (for 'cloze' cardType)." },
            tags: { type: "array", items: { type: "string" }, description: "Optional tags for the card." }
          },
          required: ["deckName", "cardType"], // Note: Zod schema handles conditional requirements for front/back/text
        }
      }
    },
    required: ["cards"],
  }
};

export const deleteNoteTool: Tool = {
  name: "delete-note",
  description: "Delete one or more Anki notes by their IDs.",
  inputSchema: {
    type: "object",
    properties: {
      noteIds: {
        type: "array",
        items: { type: "number", description: "A Note ID" },
        description: "An array of Note IDs to delete.",
        minItems: 1,
      }
    },
    required: ["noteIds"]
  }
};

export const queryCardsTool: Tool = {
  name: "query-cards",
  description: "Search for Anki cards using various criteria. Returns detailed card information.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Raw Anki search query string (e.g., 'deck:default tag:leech is:due').", minLength: 1 },
      deckName: { type: "string", description: "Exact name of the deck to search within." },
      tags: { type: "array", items: { type: "string" }, description: "List of tags (all must be present)." },
      cardState: { type: "string", enum: ["new", "learn", "due", "suspended", "buried"], description: "Filter by card state." },
      addedInDays: { type: "number", minimum: 1, description: "Filter by cards added in the last X days." },
      frontContains: { type: "string", description: "Text in 'Front' field (Basic notes)." },
      backContains: { type: "string", description: "Text in 'Back' field (Basic notes)." },
      textContains: { type: "string", description: "Text in 'Text' field (Cloze notes)." },
      anyFieldContains: { type: "string", description: "Text in any field of the note." },
      noteModel: { type: "string", description: "Filter by a specific note model (e.g., 'Basic', 'Cloze')."}
    },
    required: [] // Explicitly no top-level properties are required; logic is in the handler
  },
};
export const deleteDeckTool: Tool = {
  name: "delete-deck",
  description: "Delete an entire Anki deck and all its cards",
  inputSchema: {
    type: "object",
    properties: {
      deckName: { type: "string", description: "Name of the deck to delete" },
    },
    required: ["deckName"],
  },
};

export const getDeckStatsTool: Tool = {
  name: "get-deck-stats",
  description: "Get statistics about a deck (total cards, new, due, suspended, etc.)",
  inputSchema: {
    type: "object",
    properties: {
      deckName: { type: "string", description: "Name of the deck to get statistics for" },
    },
    required: ["deckName"],
  },
};

export const suspendCardsTool: Tool = {
  name: "suspend-cards",
  description: "Suspend cards by their IDs (temporarily disable them from reviews)",
  inputSchema: {
    type: "object",
    properties: {
      cardIds: {
        type: "array",
        items: { type: "number", description: "A Card ID" },
        description: "An array of Card IDs to suspend.",
        minItems: 1,
      }
    },
    required: ["cardIds"]
  }
};

export const unsuspendCardsTool: Tool = {
  name: "unsuspend-cards",
  description: "Unsuspend cards by their IDs (re-enable them for reviews)",
  inputSchema: {
    type: "object",
    properties: {
      cardIds: {
        type: "array",
        items: { type: "number", description: "A Card ID" },
        description: "An array of Card IDs to unsuspend.",
        minItems: 1,
      }
    },
    required: ["cardIds"]
  }
};

export const getCardInfoTool: Tool = {
  name: "get-card-info",
  description: "Get detailed information about specific cards (intervals, due dates, learning state)",
  inputSchema: {
    type: "object",
    properties: {
      cardIds: {
        type: "array",
        items: { type: "number", description: "A Card ID" },
        description: "An array of Card IDs to get information for.",
        minItems: 1,
      }
    },
    required: ["cardIds"]
  }
};


export const allTools: Tool[] = [
  createDeckTool,
  createCardTool,
  updateCardTool,
  createClozeCardTool,
  updateClozeCardTool,
  createCardsBatchTool,
  deleteNoteTool,
  queryCardsTool,
    deleteDeckTool,
  getDeckStatsTool,
  suspendCardsTool,
  unsuspendCardsTool,
  getCardInfoTool,
];

export function getToolDefinitions(): { tools: Tool[] } { // Added explicit return type
  return {
    tools: allTools,
  };
}

// Helper Functions
function validateClozeText(text: string): void {
  if (!text.includes("{{c") || !text.includes("}}")) {
    throw new AnkiError(
      "Text must contain at least one cloze deletion using {{c1::text}} syntax"
    );
  }
}

function formatNoteInfo(note: AnkiNoteInfo, deckNameFromQuery?: string): string {
  let content = `Note ID: ${note.noteId}\nModel: ${note.modelName}\n`;
  if (deckNameFromQuery) { // Deck name from query is an approximation
      content += `Deck: ${deckNameFromQuery}\n`;
  }
  content += `Tags: ${note.tags.join(", ")}\n`;

  if (note.modelName === NOTE_TYPES.CLOZE) {
    content += `Text: ${note.fields.Text?.value || "[No Text field]"}\n`; // Added fallback
    if (note.fields["Back Extra"]?.value) {
      content += `Back Extra: ${note.fields["Back Extra"].value}\n`;
    }
  } else { // Basic or other types
    content += `Front: ${note.fields.Front?.value || "[No Front field]"}\n`; // Added fallback
    content += `Back: ${note.fields.Back?.value || "[No Back field]"}\n`;   // Added fallback
    if (note.fields.Hint?.value) {
      content += `Hint: ${note.fields.Hint.value}\n`;
    }
  }
  return content.trim();
}

// Tool Handlers (All return ToolResponse with {text: {text: "..."}})

export async function handleCreateDeck(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { name: deckName } = CreateDeckArgumentsSchema.parse(args);
  await ankiService.createDeck(deckName);
  return {
    content: [{ type: "text", text: { text: `Successfully created deck: ${deckName}` } }],
  };
}

export async function handleCreateCard(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { deckName, front, back, hint, tags = [] } = CreateCardArgumentsSchema.parse(args);
  const fields: Record<string, string> = { Front: front, Back: back };
  if (hint) fields.Hint = hint;
  const noteId = await ankiService.addNote({ deckName, modelName: NOTE_TYPES.BASIC, fields, tags });
  return {
    content: [{ type: "text", text: { text: `Successfully created card in deck "${deckName}" with note ID: ${noteId}${hint ? " with a hint." : "."}` } }],
  };
}

export async function handleUpdateCard(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { noteId, front, back, tags } = UpdateCardArgumentsSchema.parse(args);
  const fieldsToUpdate: Record<string, string> = {};
  if (front !== undefined) fieldsToUpdate.Front = front;
  if (back !== undefined) fieldsToUpdate.Back = back;
  if (Object.keys(fieldsToUpdate).length > 0) {
    await ankiService.updateNoteFields(noteId, fieldsToUpdate);
  }
  if (tags !== undefined) await ankiService.replaceTags([noteId], tags);
  return {
    content: [{ type: "text", text: { text: `Successfully updated card with note ID: ${noteId}` } }],
  };
}

export async function handleCreateClozeCard(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { deckName, text, backExtra = "", tags = [] } = CreateClozeCardArgumentsSchema.parse(args);
  validateClozeText(text);
  const fields: Record<string, string> = { Text: text };
  if (backExtra) fields["Back Extra"] = backExtra;
  const noteId = await ankiService.addNote({ deckName, modelName: NOTE_TYPES.CLOZE, fields, tags });
  return {
    content: [{ type: "text", text: { text: `Successfully created cloze card in deck "${deckName}" with note ID: ${noteId}` } }],
  };
}

export async function handleUpdateClozeCard(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { noteId, text, backExtra, tags } = UpdateClozeCardArgumentsSchema.parse(args);
  const fieldsToUpdate: Record<string, string> = {};
  if (text !== undefined) {
    validateClozeText(text);
    fieldsToUpdate.Text = text;
  }
  if (backExtra !== undefined) fieldsToUpdate["Back Extra"] = backExtra;
  if (Object.keys(fieldsToUpdate).length > 0) {
    await ankiService.updateNoteFields(noteId, fieldsToUpdate);
  }
  if (tags !== undefined) await ankiService.replaceTags([noteId], tags);
  return {
    content: [{ type: "text", text: { text: `Successfully updated cloze card with note ID: ${noteId}` } }],
  };
}

export async function handleCreateCardsBatch(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const parsedArgs = args as any; // Replace with proper Zod schema parsing for 'args' if available
                                   // For now, assuming CreateCardsBatchArgumentsSchema is used implicitly or 'args' matches structure
  const cards = parsedArgs.cards;

  if (!Array.isArray(cards) || cards.length === 0) {
    return { content: [{ type: "text", text: { text: "No cards provided in the batch." } }] };
  }
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const { deckName, cardType, front, back, hint, text, backExtra, tags = [] } = card;
    if (!deckName || !cardType) {
      results.push({ inputCardIndex: i, status: "error", message: "Missing 'deckName' or 'cardType'." });
      failureCount++;
      continue;
    }
    let modelName = "";
    const cardFields: Record<string, string> = {};
    try {
      if (cardType === "basic") {
        if (!front || !back) throw new Error("Missing 'front' or 'back' for basic card.");
        modelName = NOTE_TYPES.BASIC;
        cardFields.Front = front; cardFields.Back = back;
        if (hint) cardFields.Hint = hint;
      } else if (cardType === "cloze") {
        if (!text) throw new Error("Missing 'text' for cloze card.");
        validateClozeText(text);
        modelName = NOTE_TYPES.CLOZE;
        cardFields.Text = text;
        if (backExtra) cardFields["Back Extra"] = backExtra;
      } else {
        throw new Error(`Invalid cardType: ${cardType}. Must be 'basic' or 'cloze'.`);
      }
      const noteId = await ankiService.addNote({ deckName, modelName, fields: cardFields, tags });
      results.push({ inputCardIndex: i, status: "success", noteId });
      successCount++;
    } catch (error: any) {
      const errorMessage = error instanceof AnkiError ? error.message : (error as Error).message || "Unknown error adding note";
      results.push({ inputCardIndex: i, status: "error", message: errorMessage });
      failureCount++;
    }
  }

  const summaryMessage = `Batch card creation complete. Processed ${cards.length} cards. Succeeded: ${successCount}, Failed: ${failureCount}.`;
  const resultsString = `Details (JSON):\n${JSON.stringify(results, null, 2)}`;
  
  return { 
    content: [{ type: "text", text: { text: `${summaryMessage}\n${resultsString}` } }]
  };
}

export async function handleDeleteNote(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { noteIds } = DeleteNoteArgumentsSchema.parse(args);
  // The schema already ensures noteIds is not empty if parsing succeeds.
  await ankiService.deleteNotes(noteIds);
  return {
    content: [{ type: "text", text: { text: `Successfully requested deletion for Note ID(s): ${noteIds.join(", ")}. Check Anki to confirm.` } }],
  };
}

export async function handleQueryCards(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const parsedArgs = QueryCardsArgumentsSchema.parse(args);
  const hasSearchParameters = Object.values(parsedArgs).some(value => value !== undefined);

  if (!hasSearchParameters) {
    return {
      content: [{ type: "text", text: { text: "No search criteria provided. Please specify a query or other search parameters." } }],
    };
  }

  let queryString = "";
  if (parsedArgs.query) {
    queryString = parsedArgs.query;
  } else {
    const queryParts: string[] = [];
    if (parsedArgs.deckName) queryParts.push(`deck:"${parsedArgs.deckName}"`);
    if (parsedArgs.tags && parsedArgs.tags.length > 0) {
      parsedArgs.tags.forEach(tag => queryParts.push(`tag:"${tag}"`));
    }
    if (parsedArgs.cardState) queryParts.push(`is:${parsedArgs.cardState}`);
    if (parsedArgs.addedInDays) queryParts.push(`added:${parsedArgs.addedInDays}`);
    if (parsedArgs.noteModel) queryParts.push(`note:"${parsedArgs.noteModel}"`);
    
    const contentSearches: string[] = [];
    if (parsedArgs.frontContains) contentSearches.push(parsedArgs.frontContains);
    if (parsedArgs.backContains) contentSearches.push(parsedArgs.backContains);
    if (parsedArgs.textContains) contentSearches.push(parsedArgs.textContains);
    if (parsedArgs.anyFieldContains) contentSearches.push(parsedArgs.anyFieldContains);
    
    if (contentSearches.length > 0) {
      queryParts.push(...contentSearches.map(term => term.includes(" ") ? `"${term}"` : term));
    }
    queryString = queryParts.join(" ").trim();
  }

  if (!queryString) { // Handles case where optional fields might not form a query (e.g. only undefined optionals were present)
     return {
       content: [{ type: "text", text: { text: "Search criteria provided did not form a valid query. Please refine your search terms." } }],
     };
  }
  
  console.error(`Constructed Anki query: ${queryString}`);
  const noteIds = await ankiService.findNotes(queryString);

  if (noteIds.length === 0) {
    return {
      content: [{ type: "text", text: { text: `No cards found matching your criteria: ${queryString}` } }],
    };
  }

  const notesInfo = await ankiService.getNotesInfo(noteIds);
  const formattedNotes = notesInfo.map(note => formatNoteInfo(note, parsedArgs.deckName)).join("\n\n---\n");

  return {
    content: [
      {
        type: "text",
        text: { text: `Found ${notesInfo.length} card(s) matching your criteria:\n\n${formattedNotes}` },
      },
    ],
  };
}

export async function handleToolCall(name: string, args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  try {
    switch (name) {
      case "create-deck": return await handleCreateDeck(args, ankiService);
      case "create-card": return await handleCreateCard(args, ankiService);
      case "update-card": return await handleUpdateCard(args, ankiService);
      case "create-cloze-card": return await handleCreateClozeCard(args, ankiService);
      case "update-cloze-card": return await handleUpdateClozeCard(args, ankiService);
      case "create-cards-batch": return await handleCreateCardsBatch(args, ankiService);
      case "delete-note": return await handleDeleteNote(args, ankiService);
      case "query-cards": return await handleQueryCards(args, ankiService);
      case "delete-deck": return await handleDeleteDeck(args, ankiService);
      case "get-deck-stats": return await handleGetDeckStats(args, ankiService);
      case "suspend-cards": return await handleSuspendCards(args, ankiService);
      case "unsuspend-cards": return await handleUnsuspendCards(args, ankiService);
      case "get-card-info": return await handleGetCardInfo(args, ankiService);
      default:
        console.error(`Unknown tool called: ${name}`);
        throw new AnkiError(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    console.error(`Error in handleToolCall for tool ${name}:`, error);
    // If it's a ZodError, format it nicely.
    if (error.name === 'ZodError') { // Check error.name for ZodError
        const messages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return { content: [{type: "text", text: {text: `Invalid arguments: ${messages}`}}]};
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during tool execution.";
    return {
        content: [{ type: "text", text: { text: `Tool execution error: ${errorMessage}` } }]
    };
  }
}

export async function handleDeleteDeck(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { deckName } = DeleteDeckArgumentsSchema.parse(args);
  await ankiService.deleteDeck(deckName);
  return {
    content: [{ type: "text", text: { text: `Successfully deleted deck: ${deckName}` } }],
  };
}

export async function handleGetDeckStats(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { deckName } = GetDeckStatsArgumentsSchema.parse(args);
  const stats = await ankiService.getDeckStats(deckName);
  
  const statsText = `Deck Statistics for "${stats.deckName}":
- Total Cards: ${stats.totalCards}
- New Cards: ${stats.newCards}
- Learning Cards: ${stats.learningCards}
- Due Cards: ${stats.dueCards}
- Suspended Cards: ${stats.suspendedCards}
- Buried Cards: ${stats.buriedCards}${stats.averageInterval ? `\n- Average Interval: ${stats.averageInterval} days` : ''}`;

  return {
    content: [{ type: "text", text: { text: statsText } }],
  };
}

export async function handleSuspendCards(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { cardIds } = SuspendCardsArgumentsSchema.parse(args);
  await ankiService.suspendCards(cardIds);
  return {
    content: [{ type: "text", text: { text: `Successfully suspended ${cardIds.length} card(s): ${cardIds.join(", ")}` } }],
  };
}

export async function handleUnsuspendCards(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { cardIds } = UnsuspendCardsArgumentsSchema.parse(args);
  await ankiService.unsuspendCards(cardIds);
  return {
    content: [{ type: "text", text: { text: `Successfully unsuspended ${cardIds.length} card(s): ${cardIds.join(", ")}` } }],
  };
}

export async function handleGetCardInfo(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { cardIds } = GetCardInfoArgumentsSchema.parse(args);
  const cardsInfo = await ankiService.getCardsInfo(cardIds);
  
  const cardDetails = cardsInfo.map(card => {
    // Function to get queue status with proper typing
    const getQueueStatus = (queue: number): string => {
      switch (queue) {
        case 0: return "New";
        case 1: return "Learning";
        case 2: return "Due";
        case 3: return "In Learning (day)";
        case -1: return "Suspended";
        case -2: return "User Buried";
        case -3: return "Scheduler Buried";
        default: return "Unknown";
      }
    };
    
    const queueStatus = getQueueStatus(card.queue);
    
    return `Card ID: ${card.cardId}
Note ID: ${card.noteId}
Deck: ${card.deckName}
Status: ${queueStatus}
Interval: ${card.interval} days
Due: ${card.due}
Reviews: ${card.reviews}
Lapses: ${card.lapses}
Factor: ${card.factor}%`;
  }).join("\n\n---\n");

  return {
    content: [{ type: "text", text: { text: `Card Information:\n\n${cardDetails}` } }],
  };
}