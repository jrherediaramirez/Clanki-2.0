import { AnkiService } from "../../services/anki.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { AnkiError } from "../../utils/errors.js";

// Existing Tool definitions
export const createDeckTool: Tool = {
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

export const createCardTool: Tool = {
  name: "create-card",
  description: "Create a new flashcard in a specified deck, with an optional hint.",
  inputSchema: {
    type: "object",
    properties: {
      deckName: {
        type: "string",
        description: "Name of the deck to add the card to",
      },
      front: {
        type: "string",
        description: "Front side content of the card",
      },
      back: {
        type: "string",
        description: "Back side content of the card",
      },
      hint: {
        type: "string",
        description: "Optional hint for the card (ensure your Anki note type has a 'Hint' field)",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tags for the card",
      },
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
      noteId: {
        type: "number",
        description: "ID of the note to update",
      },
      front: {
        type: "string",
        description: "New front side content",
      },
      back: {
        type: "string",
        description: "New back side content",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "New tags for the card",
      },
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
      deckName: {
        type: "string",
        description: "Name of the deck to add the card to",
      },
      text: {
        type: "string",
        description: "Text containing cloze deletions using {{c1::text}} syntax",
      },
      backExtra: {
        type: "string",
        description: "Optional extra information to show on the back of the card",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tags for the card",
      },
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
      noteId: {
        type: "number",
        description: "ID of the note to update",
      },
      text: {
        type: "string",
        description: "New text with cloze deletions using {{c1::text}} syntax",
      },
      backExtra: {
        type: "string",
        description: "New extra information to show on the back of the card",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "New tags for the card",
      },
    },
    required: ["noteId"],
  },
};

// *** NEW TOOL DEFINITION FOR BATCH CARD CREATION ***
export const createCardsBatchTool: Tool = {
  name: "create-cards-batch",
  description: "Create multiple flashcards (basic or cloze) in a single batch operation.",
  inputSchema: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        description: "An array of card objects to create.",
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
          required: ["deckName", "cardType"],
        }
      }
    },
    required: ["cards"],
  },
};

// Export all tool definitions for the MCP server
export const allTools: Tool[] = [
  createDeckTool,
  createCardTool,
  updateCardTool,
  createClozeCardTool,
  updateClozeCardTool,
  createCardsBatchTool, // *** ADDED NEW TOOL ***
];

// Function to get tool definitions
export function getToolDefinitions() {
  return {
    tools: allTools,
  };
}

// Tool handlers
export async function handleCreateDeck(args: any, ankiService: AnkiService) {
  const { name } = args;
  await ankiService.createDeck(name);
  return {
    content: [
      {
        type: "text",
        text: `Successfully created deck: ${name}`,
      },
    ],
  };
}

export async function handleCreateCard(args: any, ankiService: AnkiService) {
  const { deckName, front, back, hint, tags = [] } = args;
  
  const fields: any = { Front: front, Back: back };
  if (hint) {
    fields.Hint = hint;
  }

  const noteId = await ankiService.addNote({
    deckName,
    modelName: "Basic", // Assumes "Basic" model for single card creation
    fields,
    tags,
  });

  return {
    content: [
      {
        type: "text",
        text: `Successfully created card with note ID: ${noteId}`,
      },
    ],
  };
}

export async function handleUpdateCard(args: any, ankiService: AnkiService) {
  const { noteId, front, back, tags } = args;
  
  const updateData: any = {};
  if (front !== undefined || back !== undefined) {
    updateData.fields = {};
    if (front !== undefined) updateData.fields.Front = front;
    if (back !== undefined) updateData.fields.Back = back;
  }
  if (tags !== undefined) {
    updateData.tags = tags;
  }

  await ankiService.updateNoteFields(noteId, updateData.fields || {});
  if (tags !== undefined) {
    await ankiService.replaceTags([noteId], tags);
  }

  return {
    content: [
      {
        type: "text",
        text: `Successfully updated card with note ID: ${noteId}`,
      },
    ],
  };
}

export async function handleCreateClozeCard(args: any, ankiService: AnkiService) {
  const { deckName, text, backExtra, tags = [] } = args;
  
  const fields: any = { Text: text };
  if (backExtra) {
    fields["Back Extra"] = backExtra;
  }

  const noteId = await ankiService.addNote({
    deckName,
    modelName: "Cloze", // Assumes "Cloze" model
    fields,
    tags,
  });

  return {
    content: [
      {
        type: "text",
        text: `Successfully created cloze card with note ID: ${noteId}`,
      },
    ],
  };
}

export async function handleUpdateClozeCard(args: any, ankiService: AnkiService) {
  const { noteId, text, backExtra, tags } = args;
  
  const updateData: any = {};
  if (text !== undefined || backExtra !== undefined) {
    updateData.fields = {};
    if (text !== undefined) updateData.fields.Text = text;
    if (backExtra !== undefined) updateData.fields["Back Extra"] = backExtra;
  }
  if (tags !== undefined) {
    updateData.tags = tags;
  }

  await ankiService.updateNoteFields(noteId, updateData.fields || {});
  if (tags !== undefined) {
    await ankiService.replaceTags([noteId], tags);
  }

  return {
    content: [
      {
        type: "text",
        text: `Successfully updated cloze card with note ID: ${noteId}`,
      },
    ],
  };
}

// *** NEW HANDLER FOR BATCH CARD CREATION ***
export async function handleCreateCardsBatch(args: any, ankiService: AnkiService) {
  const { cards } = args;
  if (!Array.isArray(cards) || cards.length === 0) {
    return {
      content: [{ type: "text", text: "No cards provided in the batch." }],
    };
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
    const fields: any = {};

    if (cardType === "basic") {
      if (!front || !back) {
        results.push({ inputCardIndex: i, status: "error", message: "Missing 'front' or 'back' for basic card." });
        failureCount++;
        continue;
      }
      modelName = "Basic";
      fields.Front = front;
      fields.Back = back;
      if (hint) fields.Hint = hint;
    } else if (cardType === "cloze") {
      if (!text) {
        results.push({ inputCardIndex: i, status: "error", message: "Missing 'text' for cloze card." });
        failureCount++;
        continue;
      }
      if (!text.includes("{{c") || !text.includes("}}")) {
         results.push({ inputCardIndex: i, status: "error", message: "Cloze text must contain at least one cloze deletion using {{c1::text}} syntax." });
         failureCount++;
         continue;
      }
      modelName = "Cloze";
      fields.Text = text;
      if (backExtra) fields["Back Extra"] = backExtra;
    } else {
      results.push({ inputCardIndex: i, status: "error", message: `Invalid cardType: ${cardType}. Must be 'basic' or 'cloze'.` });
      failureCount++;
      continue;
    }

    try {
      const noteId = await ankiService.addNote({
        deckName,
        modelName,
        fields,
        tags,
      });
      results.push({ inputCardIndex: i, status: "success", noteId });
      successCount++;
    } catch (error: any) {
      const errorMessage = error instanceof AnkiError ? error.message : (error as Error).message || "Unknown error adding note";
      results.push({ inputCardIndex: i, status: "error", message: errorMessage });
      failureCount++;
    }
  }
  const resultsString = `Details (JSON):\n${JSON.stringify(results, null, 2)}`;

    return {
    content: [
      {
        type: "text",
        text: `Batch card creation complete. Processed ${cards.length} cards. Succeeded: ${successCount}, Failed: ${failureCount}.`,
      },
      {
        type: "text",        // Type is "text"
        text: resultsString, // Content is in the 'text' field, containing the JSON string
      }
    ],
  };
}


// Main tool call handler
export async function handleToolCall(name: string, args: any, ankiService: AnkiService) {
  switch (name) {
    case "create-deck":
      return await handleCreateDeck(args, ankiService);
    case "create-card":
      return await handleCreateCard(args, ankiService);
    case "update-card":
      return await handleUpdateCard(args, ankiService);
    case "create-cloze-card":
      return await handleCreateClozeCard(args, ankiService);
    case "update-cloze-card":
      return await handleUpdateClozeCard(args, ankiService);
    case "create-cards-batch": // *** ADDED NEW CASE ***
      return await handleCreateCardsBatch(args, ankiService);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}