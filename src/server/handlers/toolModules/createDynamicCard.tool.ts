// src/server/handlers/toolModules/createDynamicCard.tool.ts

// Import necessary types, services, and constants
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../../types/mcp.js";
import { AnkiService } from "../../../services/anki.js";
import { CreateDynamicCardArgumentsSchema } from "../../../services/validation.js";
import { NOTE_TYPES } from "../../../utils/constants.js"; // For checking if the dynamic model is Cloze
import { AnkiError } from "../../../utils/errors.js";

/**
 * Validates that the provided text for a cloze card contains the required cloze deletion syntax.
 * Throws an AnkiError if the syntax is missing.
 * @param text - The text to validate.
 * @param fieldName - The name of the field being validated (e.g., "Text", "Front").
 */
function validateClozeText(text: string, fieldName: string = "Text"): void {
  if (!text || typeof text !== 'string' || !text.includes("{{c") || !text.includes("}}")) {
    throw new AnkiError(
      `Field "${fieldName}" for Cloze model must contain at least one cloze deletion using {{c1::text}} syntax. Received: "${text}"`
    );
  }
}

/**
 * Tool definition for creating a new Anki card using any specified note type/model
 * with custom field mapping. It validates provided fields against the model's actual fields.
 */
export const createDynamicCardToolDefinition: Tool = {
  name: "create-dynamic-card",
  description: "Create a new card using any specified note type/model with custom field mapping. Validates fields against the model.",
  inputSchema: {
    type: "object",
    properties: {
      deckName: {
        type: "string",
        description: "The name of the deck to add the card to",
        minLength: 1
      },
      modelName: {
        type: "string",
        description: "The note type/model name (e.g., 'Basic', 'Cloze')",
        minLength: 1
      },
      fields: {
        type: "object",
        additionalProperties: {
          type: "string"
        },
        description: "Field values for the card (e.g., {Front: 'question', Back: 'answer'})"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Optional array of tags for the card"
      }
    },
    required: ["deckName", "modelName", "fields"]
  },
};

/**
 * Handles the execution of the create-dynamic-card tool.
 * It parses arguments (deckName, modelName, fields, tags),
 * performs cloze validation if the specified model is a Cloze type,
 * calls AnkiService to add the note (which includes field validation against the model),
 * and returns a success response.
 * @param args - The arguments for the tool, expected to match CreateDynamicCardArgumentsSchema.
 * @param ankiService - An instance of AnkiService.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleCreateDynamicCard(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  // Parse and validate arguments.
  const { deckName, modelName, fields, tags = [] } = CreateDynamicCardArgumentsSchema.parse(args);

  try {
    // If the specified modelName suggests it's a Cloze type,
    // attempt to validate the relevant field for cloze syntax.
    if (modelName.toLowerCase().includes(NOTE_TYPES.CLOZE.toLowerCase())) {
      // Attempt to find a primary cloze field (commonly 'Text' or 'Front')
      const clozeFieldKey = Object.keys(fields).find(key =>
        key.toLowerCase() === 'text' || key.toLowerCase() === 'front'
      );
      const clozeFieldValue = clozeFieldKey ? fields[clozeFieldKey] : undefined;

      if (clozeFieldValue) {
        validateClozeText(clozeFieldValue, clozeFieldKey);
      } else {
        // If 'Text' or 'Front' isn't explicitly provided with cloze content,
        // check if *any* provided field has cloze syntax. This is a fallback.
        const fieldWithCloze = Object.values(fields).find(value =>
          typeof value === 'string' && value.includes("{{c") && value.includes("}}")
        );
        if (!fieldWithCloze) {
          // This error might be too strict if the model has an unusual primary cloze field name
          // not covered by 'Text' or 'Front'. However, addNoteWithValidation will ultimately
          // catch issues if required fields for the model are missing or malformed.
          throw new AnkiError(
            `For Cloze model "${modelName}", at least one field (typically 'Text' or 'Front') must contain cloze syntax (e.g., {{c1::text}}). None found in provided fields.`
          );
        }
      }
    }

    // Call AnkiService to add the note.
    // addNoteWithValidation performs critical validation:
    // 1. Checks if the modelName exists.
    // 2. Checks if all provided field names in 'fields' are valid for that modelName.
    // 3. (Implicitly) AnkiConnect will check if all *required* fields for the model are present.
    const noteId = await ankiService.addNoteWithValidation({
      deckName,
      modelName,
      fields,
      tags,
    });

    // Format a summary of the created card's fields for the response.
    const fieldsList = Object.entries(fields)
      .map(([field, value]) => `${field}: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`)
      .join(', ');

    return {
      content: [{
        type: "text",
        text: {
          text: `Successfully created "${modelName}" card in deck "${deckName}" with note ID: ${noteId}.\nFields processed: ${fieldsList || "None"}.`
        }
      }],
    };
  } catch (error) {
    // Catch and re-throw AnkiErrors, or wrap other errors.
    // The main tool dispatcher will handle formatting these errors for the final response.
    if (error instanceof AnkiError) {
      throw error;
    }
    console.error("Error in handleCreateDynamicCard:", error); // Log unexpected errors
    throw new AnkiError(`Failed to create dynamic card: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
