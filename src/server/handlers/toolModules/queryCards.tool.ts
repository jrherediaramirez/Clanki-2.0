// src/server/handlers/toolModules/queryCards.tool.ts

// Import necessary types, services, and constants
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../../types/mcp.js";
import { AnkiService } from "../../../services/anki.js";
import { QueryCardsArgumentsSchema } from "../../../services/validation.js";
import { AnkiNoteInfo } from "../../../types/anki.js"; // For typing the note info
import { NOTE_TYPES } from "../../../utils/constants.js"; // For checking model type

/**
 * Formats the detailed information of an Anki note for display.
 * @param note - The AnkiNoteInfo object.
 * @param deckNameFromQuery - Optional deck name if the query was scoped to a specific deck.
 * @returns A string representation of the note's information.
 */
function formatNoteInfo(note: AnkiNoteInfo, deckNameFromQuery?: string): string {
  let content = `Note ID: ${note.noteId}\nModel: ${note.modelName}\n`;
  // If the query was for a specific deck, it's useful to include this,
  // as notesInfo itself doesn't always return the deck name directly.
  if (deckNameFromQuery) {
    content += `Deck: ${deckNameFromQuery}\n`;
  }
  content += `Tags: ${note.tags.join(", ") || "No tags"}\n`; // Handle empty tags array

  // Attempt to display primary fields based on common model types
  if (note.modelName.toLowerCase().includes(NOTE_TYPES.CLOZE.toLowerCase())) {
    // For Cloze notes, 'Text' is the primary field. 'Front' might be a fallback.
    content += `Text: ${note.fields.Text?.value || note.fields.Front?.value || "[No primary text field for Cloze]"}\n`;
    if (note.fields["Back Extra"]?.value) {
      content += `Back Extra: ${note.fields["Back Extra"].value}\n`;
    }
  } else { // For Basic and other standard notes
    content += `Front: ${note.fields.Front?.value || "[No Front field]"}\n`;
    content += `Back: ${note.fields.Back?.value || "[No Back field]"}\n`;
    if (note.fields.Hint?.value) {
      content += `Hint: ${note.fields.Hint.value}\n`;
    }
  }
  // You could add more fields here if your common note types have other important fields.
  // For example:
  // Object.entries(note.fields).forEach(([fieldName, fieldData]) => {
  //   if (!['Front', 'Back', 'Text', 'Back Extra', 'Hint'].includes(fieldName)) {
  //     content += `${fieldName}: ${fieldData.value.substring(0, 100)}${fieldData.value.length > 100 ? '...' : ''}\n`;
  //   }
  // });
  return content.trim();
}

/**
 * Tool definition for searching Anki cards using various criteria.
 * Returns detailed information for the notes associated with the found cards.
 */
export const queryCardsToolDefinition: Tool = {
  name: "query-cards",
  description: "Search for Anki cards using various criteria. Returns detailed card information.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Raw Anki search query string (e.g., 'deck:default tag:leech is:due')"
      },
      deckName: {
        type: "string",
        description: "Exact name of the deck to search within"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "List of tags to filter by (all must be present)"
      },
      cardState: {
        type: "string",
        enum: ["new", "learn", "due", "suspended", "buried"],
        description: "Filter by card state (e.g., new, learn, due)"
      },
      addedInDays: {
        type: "number",
        minimum: 1,
        description: "Filter by cards added in the last X days"
      },
      frontContains: {
        type: "string",
        description: "Text contained in the 'Front' field (for Basic notes)"
      },
      backContains: {
        type: "string",
        description: "Text contained in the 'Back' field (for Basic notes)"
      },
      textContains: {
        type: "string",
        description: "Text contained in the 'Text' field (for Cloze notes)"
      },
      anyFieldContains: {
        type: "string",
        description: "Text contained in any field of the note"
      },
      noteModel: {
        type: "string",
        description: "Filter by a specific note model (e.g., 'Basic', 'Cloze')"
      }
    },
    required: []
  },
};

/**
 * Handles the execution of the query-cards tool.
 * It parses various optional search parameters, constructs an Anki search query string,
 * calls AnkiService to find notes matching the query, retrieves detailed info for those notes,
 * and returns the formatted information.
 * @param args - The arguments for the tool, expected to match QueryCardsArgumentsSchema.
 * @param ankiService - An instance of AnkiService.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleQueryCards(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  // Parse and validate arguments.
  const parsedArgs = QueryCardsArgumentsSchema.parse(args);

  // Check if any search parameters were actually provided.
  const hasSearchParameters = Object.values(parsedArgs).some(value => value !== undefined);
  if (!hasSearchParameters) {
    return {
      content: [{
        type: "text",
        text: { text: "No search criteria provided. Please specify a 'query' or other search parameters like 'deckName', 'tags', etc." }
      }],
    };
  }

  let queryString = "";
  if (parsedArgs.query) {
    // If a raw query string is provided, use it directly.
    queryString = parsedArgs.query;
  } else {
    // Otherwise, construct the query string from individual parameters.
    const queryParts: string[] = [];
    if (parsedArgs.deckName) {
      queryParts.push(`deck:"${parsedArgs.deckName}"`);
    }
    if (parsedArgs.tags && parsedArgs.tags.length > 0) {
      parsedArgs.tags.forEach(tag => queryParts.push(`tag:"${tag}"`));
    }
    if (parsedArgs.cardState) {
      queryParts.push(`is:${parsedArgs.cardState}`);
    }
    if (parsedArgs.addedInDays) {
      // Anki's 'added' search term expects positive integers.
      queryParts.push(`added:${parsedArgs.addedInDays}`);
    }
    if (parsedArgs.noteModel) {
      queryParts.push(`note:"${parsedArgs.noteModel}"`);
    }

    // Handle content search fields
    const contentSearches: string[] = [];
    if (parsedArgs.frontContains) {
      contentSearches.push(`Front:*${parsedArgs.frontContains}*`);
    }
    if (parsedArgs.backContains) {
      contentSearches.push(`Back:*${parsedArgs.backContains}*`);
    }
    if (parsedArgs.textContains) { // Typically for Cloze notes
      contentSearches.push(`Text:*${parsedArgs.textContains}*`);
    }
    if (parsedArgs.anyFieldContains) {
      // For 'anyFieldContains', we don't specify a field name.
      // Anki's search syntax will search all relevant fields.
      // Ensure terms with spaces are quoted if not already.
      contentSearches.push(parsedArgs.anyFieldContains.includes(" ") ? `"${parsedArgs.anyFieldContains}"` : parsedArgs.anyFieldContains);
    }

    if (contentSearches.length > 0) {
      // Add content search terms. Anki search combines terms with AND by default.
      queryParts.push(...contentSearches);
    }
    queryString = queryParts.join(" ").trim();
  }

  if (!queryString) {
    // This case might occur if optional parameters were provided but were all empty or undefined,
    // and no raw query was given.
    return {
      content: [{
        type: "text",
        text: { text: "Search criteria provided did not form a valid query. Please refine your search terms." }
      }],
    };
  }

  // Find notes matching the constructed query.
  const noteIds = await ankiService.findNotes(queryString);

  if (noteIds.length === 0) {
    return {
      content: [{
        type: "text",
        text: { text: `No cards found matching your criteria: "${queryString}"` }
      }],
    };
  }

  // Retrieve detailed information for the found notes.
  const notesInfo = await ankiService.getNotesInfo(noteIds);

  // Format the notes information for the response.
  const formattedNotes = notesInfo
    .map(note => formatNoteInfo(note, parsedArgs.deckName)) // Pass deckName for context
    .join("\n\n---\n\n"); // Separator for multiple notes

  return {
    content: [
      {
        type: "text",
        text: {
          text: `Found ${notesInfo.length} note(s) matching your criteria ("${queryString}"):\n\n${formattedNotes}`,
        },
      },
    ],
  };
}
