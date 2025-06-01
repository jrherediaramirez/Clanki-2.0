import { AnkiService } from "../../services/anki.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

// Tool definitions
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

// Export all tool definitions for the MCP server
export const allTools: Tool[] = [
  createDeckTool,
  createCardTool,
  updateCardTool,
  createClozeCardTool,
  updateClozeCardTool,
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
    modelName: "Basic",
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
    modelName: "Cloze",
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
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}