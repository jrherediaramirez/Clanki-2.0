// jrherediaramirez/clanki-2.0/Clanki-2.0-6b23594186d62acc58f666efd8a075e8fcf06b78/src/server/handlers/tools.ts
import { AnkiService } from "../../services/anki.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../types/mcp.js";
import { AnkiError } from "../../utils/errors.js";
import {
  CreateDeckArgumentsSchema,
  CreateCardArgumentsSchema,
  UpdateCardArgumentsSchema,
  CreateClozeCardArgumentsSchema,
  UpdateClozeCardArgumentsSchema,
  DeleteNoteArgumentsSchema,
  QueryCardsArgumentsSchema,
  GetModelInfoArgumentsSchema,
  CreateDynamicCardArgumentsSchema,
  SmartCardCreationArgumentsSchema,
} from "../../services/validation.js";
import { NOTE_TYPES } from "../../utils/constants.js";
import { AnkiNoteInfo, ModelInfo } from "../../types/anki.js";

// --- Guiding Prompt Text ---
const CLANKI_OPERATIONAL_GUIDELINES_TEXT = `
// --- Clanki 2.0 Operational Guidelines ---

**Workflow for Card Creation:**

1. **Check User's Setup:**
   * Call \`get-model-names\` to see available note types
   * For specialized content, call \`get-model-info\` on relevant custom types
   * Inform user of applicable custom note types found

2. **Tool Selection:**
   * **Batch Creation:** Use \`create-cards-batch\` for multiple cards from documents/lists
   * **Single Cards:** Use \`create-dynamic-card\` (user specifies type) or \`smart-create-card\` (AI infers)
   * **Basic/Cloze:** Use \`create-card\` or \`create-cloze-card\` when explicitly requested

3. **Best Practices:**
   * Break complex content into logical, focused cards
   * Map content accurately to custom note type fields
   * Use relevant tags for organization
   * Confirm deck name if not specified
   * For batch operations, summarize plan before executing

**Key Rules:**
- Always check available note types first
- Prefer specialized note types over Basic when applicable
- Use batch creation for efficiency with multiple cards
- Present errors clearly with suggested solutions
`;


// --- Existing Tool Definitions ---
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
  description: "Create a new flashcard in a specified deck, with an optional hint (uses 'Basic' model).",
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
  description: "Update an existing flashcard (assumes 'Basic' or similar model structure).",
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
  description: "Create a new cloze deletion card in a specified deck (uses 'Cloze' model). Use {{c1::text}} syntax for cloze deletions.",
  inputSchema: {
    type: "object",
    properties: {
      deckName: { type: "string", description: "Name of the deck to add the card to" },
      text: { type: "string", description: "Text containing cloze deletions using {{c1::text}} syntax (for the 'Text' field)" },
      backExtra: { type: "string", description: "Optional extra information to show on the back of the card (for the 'Back Extra' field)" },
      tags: { type: "array", items: { type: "string" }, description: "Optional tags for the card" },
    },
    required: ["deckName", "text"],
  },
};

export const updateClozeCardTool: Tool = {
  name: "update-cloze-card",
  description: "Update an existing cloze deletion card (assumes 'Cloze' model structure).",
  inputSchema: {
    type: "object",
    properties: {
      noteId: { type: "number", description: "ID of the note to update" },
      text: { type: "string", description: "New text with cloze deletions using {{c1::text}} syntax (for the 'Text' field)" },
      backExtra: { type: "string", description: "New extra information to show on the back of the card (for the 'Back Extra' field)" },
      tags: { type: "array", items: { type: "string" }, description: "New tags for the card" },
    },
    required: ["noteId"],
  },
};

export const createCardsBatchTool: Tool = {
  name: "create-cards-batch",
  description: "Create multiple flashcards in a single operation, supporting various note types (models).",
  inputSchema: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        description: "An array of card objects to create.",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            deckName: { type: "string", description: "Name of the deck for this card." },
            modelName: { type: "string", description: "Name of the Anki note type (model) to use (e.g., 'Basic', 'Cloze', 'Pharmacology')." },
            fields: {
              type: "object",
              description: "An object where keys are field names (e.g., 'Front', 'Back', 'Drug Name') and values are the content for those fields.",
              additionalProperties: { type: "string" },
              minProperties: 1
            },
            tags: { type: "array", items: { type: "string" }, description: "Optional tags for the card." }
          },
          required: ["deckName", "modelName", "fields"]
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
      tags: { type: "array", items: { type: "string" }, description: "List of tags to filter by (all must be present)." },
      cardState: { type: "string", enum: ["new", "learn", "due", "suspended", "buried"], description: "Filter by card state (e.g., new, learn, due)." },
      addedInDays: { type: "number", minimum: 1, description: "Filter by cards added in the last X days." },
      frontContains: { type: "string", description: "Text contained in the 'Front' field (for Basic notes)." },
      backContains: { type: "string", description: "Text contained in the 'Back' field (for Basic notes)." },
      textContains: { type: "string", description: "Text contained in the 'Text' field (for Cloze notes)." },
      anyFieldContains: { type: "string", description: "Text contained in any field of the note." },
      noteModel: { type: "string", description: "Filter by a specific note model (e.g., 'Basic', 'Cloze')."}
    },
    required: [],
  },
};

export const getModelNamesTool: Tool = {
  name: "get-model-names",
  description: "Get all available note types/models in the Anki collection.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const getModelInfoTool: Tool = {
  name: "get-model-info",
  description: "Get detailed information about a specific note type/model, including its fields and templates.",
  inputSchema: {
    type: "object",
    properties: {
      modelName: {
        type: "string",
        description: "Name of the note type/model to inspect",
        minLength: 1
      }
    },
    required: ["modelName"],
  },
};

export const createDynamicCardTool: Tool = {
  name: "create-dynamic-card",
  description: "Create a new card using any specified note type/model with custom field mapping. Validates fields against the model.",
  inputSchema: {
    type: "object",
    properties: {
      deckName: { type: "string", description: "Name of the deck", minLength: 1 },
      modelName: { type: "string", description: "Name of the note type/model", minLength: 1 },
      fields: {
        type: "object",
        description: "Field names and values as key-value pairs. Cannot be empty.",
        additionalProperties: { type: "string" },
        minProperties: 1
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tags"
      }
    },
    required: ["deckName", "modelName", "fields"],
  },
};

export const smartCreateCardTool: Tool = {
    name: "smart-create-card",
    description: "Intelligently create a new card by attempting to infer the best note type/model and mapping provided content to its fields. Can also use a suggested note type.",
    inputSchema: {
        type: "object",
        properties: {
            deckName: { type: "string", description: "Name of the deck for the new card.", minLength: 1 },
            content: {
                type: "object",
                description: "Key-value pairs of unstructured content to be mapped to card fields. Cannot be empty.",
                additionalProperties: { type: "string" },
                minProperties: 1
            },
            suggestedType: {
                type: "string",
                description: "Optional suggested note model/type for the card."
            },
            tags: {
                type: "array",
                items: { type: "string" },
                description: "Optional tags for the new card."
            }
        },
        required: ["deckName", "content"],
    },
};

// --- New Tool Definition for Operational Guidelines ---
export const getClankiOperationalGuidelinesTool: Tool = {
  name: "get_clanki_operational_guidelines",
  description: "Returns a pre-defined set of operational guidelines (a system prompt) for an AI assistant to effectively use Clanki 2.0 tools.",
  inputSchema: { // No input arguments needed
    type: "object",
    properties: {},
    required: [],
  }
};

// --- Updated allTools Array ---
export const allTools: Tool[] = [
  createDeckTool,
  createCardTool,
  updateCardTool,
  createClozeCardTool,
  updateClozeCardTool,
  createCardsBatchTool,
  deleteNoteTool,
  queryCardsTool,
  getModelNamesTool,
  getModelInfoTool,
  createDynamicCardTool,
  smartCreateCardTool,
  getClankiOperationalGuidelinesTool, // Added new tool
];

export function getToolDefinitions(): { tools: Tool[] } {
  return {
    tools: allTools,
  };
}

// --- Helper Functions ---
function validateClozeText(text: string, fieldName: string = "Text"): void {
  if (!text || typeof text !== 'string' || !text.includes("{{c") || !text.includes("}}")) {
    throw new AnkiError(
      `Field "${fieldName}" for Cloze model must contain at least one cloze deletion using {{c1::text}} syntax. Received: "${text}"`
    );
  }
}

function formatNoteInfo(note: AnkiNoteInfo, deckNameFromQuery?: string): string {
  let content = `Note ID: ${note.noteId}\nModel: ${note.modelName}\n`;
  if (deckNameFromQuery) {
      content += `Deck: ${deckNameFromQuery}\n`;
  }
  content += `Tags: ${note.tags.join(", ")}\n`;

  if (note.modelName.toLowerCase().includes(NOTE_TYPES.CLOZE.toLowerCase())) {
    content += `Text: ${note.fields.Text?.value || note.fields.Front?.value || "[No primary text field]"}\n`;
    if (note.fields["Back Extra"]?.value) {
      content += `Back Extra: ${note.fields["Back Extra"].value}\n`;
    }
  } else {
    content += `Front: ${note.fields.Front?.value || "[No Front field]"}\n`;
    content += `Back: ${note.fields.Back?.value || "[No Back field]"}\n`;
    if (note.fields.Hint?.value) {
      content += `Hint: ${note.fields.Hint.value}\n`;
    }
  }
  return content.trim();
}

// --- Tool Handlers ---
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
  const noteId = await ankiService.addNoteWithValidation({ deckName, modelName: NOTE_TYPES.BASIC, fields, tags });
  return {
    content: [{ type: "text", text: { text: `Successfully created Basic card in deck "${deckName}" with note ID: ${noteId}${hint ? " with a hint." : "."}` } }],
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
  validateClozeText(text, "Text");
  const fields: Record<string, string> = { Text: text };
  if (backExtra) fields["Back Extra"] = backExtra;
  const noteId = await ankiService.addNoteWithValidation({ deckName, modelName: NOTE_TYPES.CLOZE, fields, tags });
  return {
    content: [{ type: "text", text: { text: `Successfully created Cloze card in deck "${deckName}" with note ID: ${noteId}` } }],
  };
}

export async function handleUpdateClozeCard(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { noteId, text, backExtra, tags } = UpdateClozeCardArgumentsSchema.parse(args);
  const fieldsToUpdate: Record<string, string> = {};
  if (text !== undefined) {
    validateClozeText(text, "Text");
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
  const parsedArgs = args as {
    cards: Array<{
      deckName: string;
      modelName: string;
      fields: Record<string, string>;
      tags?: string[];
    }>;
  };
  const cards = parsedArgs.cards;

  if (!Array.isArray(cards) || cards.length === 0) {
    return { content: [{ type: "text", text: { text: "No cards provided in the batch." } }] };
  }

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < cards.length; i++) {
    const cardDef = cards[i];
    const { deckName, modelName, fields, tags = [] } = cardDef;

    try {
      if (modelName.toLowerCase() === NOTE_TYPES.CLOZE.toLowerCase()) {
        const clozeTextField = fields["Text"] || fields["Front"];
        if (clozeTextField) {
          validateClozeText(clozeTextField, fields["Text"] ? "Text" : "Front");
        }
      }
      const noteId = await ankiService.addNoteWithValidation({
        deckName,
        modelName,
        fields,
        tags,
      });
      results.push({ inputCardIndex: i, status: "success", noteId, modelNameUsed: modelName });
      successCount++;
    } catch (error: any) {
      const errorMessage = error instanceof AnkiError ? error.message : (error as Error).message || "Unknown error adding note";
      results.push({ inputCardIndex: i, status: "error", modelNameAttempted: modelName, message: errorMessage });
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
    if (parsedArgs.frontContains) contentSearches.push(`Front:*${parsedArgs.frontContains}*`);
    if (parsedArgs.backContains) contentSearches.push(`Back:*${parsedArgs.backContains}*`);
    if (parsedArgs.textContains) contentSearches.push(`Text:*${parsedArgs.textContains}*`);
    if (parsedArgs.anyFieldContains) contentSearches.push(parsedArgs.anyFieldContains);
    if (contentSearches.length > 0) {
      queryParts.push(...contentSearches.map(term => term.includes(" ") && !term.startsWith("\"") ? `"${term}"` : term));
    }
    queryString = queryParts.join(" ").trim();
  }

  if (!queryString) {
     return {
       content: [{ type: "text", text: { text: "Search criteria provided did not form a valid query. Please refine your search terms." } }],
     };
  }

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

export async function handleGetModelNames(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const modelNames = await ankiService.getModelNames();
  return {
    content: [{
      type: "text",
      text: { text: `Available note types/models (${modelNames.length}):\n${modelNames.map(name => `• ${name}`).join('\n')}` }
    }],
  };
}

export async function handleGetModelInfo(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { modelName } = GetModelInfoArgumentsSchema.parse(args);
  const modelInfo = await ankiService.getModelInfo(modelName);
  const infoText = `Note Type: ${modelInfo.modelName}
Type: ${modelInfo.isCloze ? 'Cloze Deletion' : 'Standard'}
Fields (${modelInfo.fields.length}):
${modelInfo.fields.map((field, i) => `  ${i + 1}. ${field}`).join('\n')}
Templates (${modelInfo.templates.length}):
${modelInfo.templates.map((template, i) => `  ${i + 1}. ${template.name} (Q: ${template.qfmt.substring(0,30)}..., A: ${template.afmt.substring(0,30)}...)`).join('\n')}
CSS:\n${modelInfo.css ? modelInfo.css.substring(0, 200) + (modelInfo.css.length > 200 ? "..." : "") : "Default"}`;
  return {
    content: [{ type: "text", text: { text: infoText } }],
  };
}

export async function handleCreateDynamicCard(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { deckName, modelName, fields, tags = [] } = CreateDynamicCardArgumentsSchema.parse(args);
  try {
    if (modelName.toLowerCase() === NOTE_TYPES.CLOZE.toLowerCase()) {
        const clozeTextField = fields["Text"] || fields["Front"];
        if (clozeTextField) {
          validateClozeText(clozeTextField, fields["Text"] ? "Text" : "Front");
        } else {
          const fieldWithCloze = Object.values(fields).find(value => typeof value === 'string' && value.includes("{{c") && value.includes("}}"));
          if (!fieldWithCloze) {
            throw new AnkiError(`For Cloze model "${modelName}", at least one field must contain cloze syntax (e.g., {{c1::text}}). None found in provided fields.`);
          }
        }
    }
    const noteId = await ankiService.addNoteWithValidation({ deckName, modelName, fields, tags });
    const fieldsList = Object.entries(fields)
      .map(([field, value]) => `${field}: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`)
      .join(', ');
    return {
      content: [{
        type: "text",
        text: { text: `Successfully created "${modelName}" card in deck "${deckName}" with note ID: ${noteId}\nFields: ${fieldsList}` }
      }],
    };
  } catch (error) {
    if (error instanceof AnkiError) { throw error; }
    console.error("Error in handleCreateDynamicCard:", error);
    throw new AnkiError(`Failed to create dynamic card: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleSmartCardCreation(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  const { deckName, content, suggestedType, tags = [] } = SmartCardCreationArgumentsSchema.parse(args);
  const allModels = await ankiService.getAllModelsInfo();
  let targetModelName = suggestedType;
  if (targetModelName && !allModels[targetModelName]) {
    return {
      content: [{
        type: "text",
        text: { text: `Suggested note type "${targetModelName}" not found. Available types: ${Object.keys(allModels).join(', ')}. Please try again or let me infer the type.` }
      }],
    };
  }
  if (!targetModelName) {
    targetModelName = inferBestModelType(content, allModels);
    console.log(`Inferred model type: ${targetModelName}`);
  }
  const targetModelInfo = allModels[targetModelName];
  if (!targetModelInfo) {
      return {
        content: [{ type: "text", text: { text: `Could not determine or find a valid note type. Defaulted or inferred type "${targetModelName}" is not available.` }}],
      };
  }
  const fieldMapping = mapContentToFields(content, targetModelInfo);
  if (Object.keys(fieldMapping).length === 0) {
      return {
        content: [{ type: "text", text: { text: `Could not map any provided content to the fields of note type "${targetModelName}". Please check content keys or try a different note type.` }}],
      };
  }
  return await handleCreateDynamicCard({ deckName, modelName: targetModelName, fields: fieldMapping, tags }, ankiService);
}

// --- New Handler for Operational Guidelines ---
export async function handleGetClankiOperationalGuidelines(args: unknown, ankiService: AnkiService): Promise<ToolResponse> {
  // This handler simply returns the predefined text. No interaction with ankiService is needed.
  // No arguments to parse for this tool.
  return {
    content: [{
      type: "text",
      text: { text: CLANKI_OPERATIONAL_GUIDELINES_TEXT }
    }],
  };
}

// --- Helper functions for smart creation (inferBestModelType, mapContentToFields) ---
function inferBestModelType(content: Record<string, string>, models: Record<string, ModelInfo>): string {
  const contentKeys = Object.keys(content).map(k => k.toLowerCase());
  let bestScore = -1;
  let bestModel: string = NOTE_TYPES.BASIC;
  for (const [modelName, modelInfo] of Object.entries(models)) {
    if (!modelInfo || !Array.isArray(modelInfo.fields)) { continue; }
    let score = 0;
    const modelFields = modelInfo.fields.map(f => f.toLowerCase());
    for (const contentKey of contentKeys) {
      if (modelFields.includes(contentKey)) { score += 2; }
      else if (modelFields.some(f => f.includes(contentKey) || contentKey.includes(f))) { score += 1; }
    }
    if (contentKeys.some(key => modelName.toLowerCase().includes(key))) { score += 0.5; }
    if (modelFields.length > 0) {
        const matchedFieldCount = modelFields.filter(mf => contentKeys.some(ck => mf.includes(ck) || ck.includes(mf))).length;
        score += (matchedFieldCount / modelFields.length) * 2;
    }
    if (score > bestScore) { bestScore = score; bestModel = modelName; }
  }
  return bestModel;
}

function mapContentToFields(content: Record<string, string>, modelInfo: ModelInfo): Record<string, string> {
  const mapping: Record<string, string> = {};
   if (!modelInfo || !Array.isArray(modelInfo.fields)) { return mapping; }
  const usedModelFields = new Set<string>();
  const usedContentKeys = new Set<string>();
  for (const modelField of modelInfo.fields) {
    const modelFieldLower = modelField.toLowerCase();
    for (const contentKey of Object.keys(content)) {
      if (usedContentKeys.has(contentKey)) continue;
      if (modelFieldLower === contentKey.toLowerCase()) {
        mapping[modelField] = content[contentKey];
        usedModelFields.add(modelField);
        usedContentKeys.add(contentKey);
        break;
      }
    }
  }
  for (const modelField of modelInfo.fields) {
    if (usedModelFields.has(modelField)) continue;
    const modelFieldLower = modelField.toLowerCase();
    let bestContentKeyForPartialMatch: string | null = null;
    let highestPartialMatchScore = 0;
    for (const contentKey of Object.keys(content)) {
      if (usedContentKeys.has(contentKey)) continue;
      const contentKeyLower = contentKey.toLowerCase();
      if (modelFieldLower.includes(contentKeyLower) || contentKeyLower.includes(modelFieldLower)) {
        const score = contentKeyLower.length;
        if (score > highestPartialMatchScore) {
            highestPartialMatchScore = score;
            bestContentKeyForPartialMatch = contentKey;
        }
      }
    }
    if (bestContentKeyForPartialMatch) {
        mapping[modelField] = content[bestContentKeyForPartialMatch];
        usedModelFields.add(modelField);
        usedContentKeys.add(bestContentKeyForPartialMatch);
    }
  }
  const commonMappings: Record<string, string[]> = {
      "Front": ["front", "question", "term", "frontside"],
      "Back": ["back", "answer", "definition", "backside"],
      "Text": ["text", "cloze_text", "cloze text", "content"],
  };
  for (const modelField of modelInfo.fields) {
      if (usedModelFields.has(modelField) || !commonMappings[modelField]) continue;
      for (const altName of commonMappings[modelField]) {
          const altNameLower = altName.toLowerCase();
          for (const contentKey of Object.keys(content)) {
              if (usedContentKeys.has(contentKey)) continue;
              if (contentKey.toLowerCase() === altNameLower) {
                  mapping[modelField] = content[contentKey];
                  usedModelFields.add(modelField);
                  usedContentKeys.add(contentKey);
                  break;
              }
          }
          if (usedModelFields.has(modelField)) break;
      }
  }
  return mapping;
}

// --- Updated handleToolCall Switch Statement ---
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
      case "get-model-names": return await handleGetModelNames(args, ankiService);
      case "get-model-info": return await handleGetModelInfo(args, ankiService);
      case "create-dynamic-card": return await handleCreateDynamicCard(args, ankiService);
      case "smart-create-card": return await handleSmartCardCreation(args, ankiService);
      case "get_clanki_operational_guidelines": return await handleGetClankiOperationalGuidelines(args, ankiService); // Added new case
      default:
        console.error(`Unknown tool called: ${name}`);
        throw new AnkiError(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    console.error(`Error in handleToolCall for tool ${name}:`, error);
    if (error.name === 'ZodError') {
        const messages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return { content: [{type: "text", text: {text: `Invalid arguments for tool "${name}": ${messages}`}}]};
    }
    const errorMessage = error instanceof AnkiError ? error.message : (error instanceof Error ? error.message : "An unknown error occurred during tool execution.");
    return {
        content: [{ type: "text", text: { text: `Tool execution error for "${name}": ${errorMessage}` } }]
    };
  }
}