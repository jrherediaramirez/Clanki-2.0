// src/server/handlers/toolModules/createCardsBatch.tool.ts

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../../types/mcp.js";
import { AnkiService } from "../../../services/anki.js";
import { AnkiError } from "../../../utils/errors.js";
import { NOTE_TYPES } from "../../../utils/constants.js";
import { z } from "zod"; // Zod is used for defining and validating the input schema.

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

// Define the Zod schema for individual card definitions within the batch.
// This was previously part of the inline schema in the main tools.ts.
const BatchCardDefinitionSchema = z.object({
  deckName: z.string().min(1, "Deck name cannot be empty."),
  modelName: z.string().min(1, "Model name cannot be empty."),
  fields: z.record(z.string(), z.string())
    .refine(obj => Object.keys(obj).length > 0, {
      message: "Fields object cannot be empty.",
    }),
  tags: z.array(z.string()).optional(),
});

// Define the Zod schema for the arguments of the create-cards-batch tool.
export const CreateCardsBatchArgumentsSchema = z.object({
  cards: z.array(BatchCardDefinitionSchema).min(1, "At least one card definition must be provided."),
});

/**
 * Tool definition for creating multiple Anki flashcards in a single operation.
 * Supports various note types (models) by allowing specification per card.
 */
export const createCardsBatchToolDefinition: Tool = {
  name: "create-cards-batch",
  description: "Create multiple flashcards in a single operation, supporting various note types (models).",
  inputSchema: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        items: {
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
        description: "Array of card definitions to create",
        minItems: 1
      }
    },
    required: ["cards"]
  },
};

/**
 * Handles the execution of the create-cards-batch tool.
 * It parses an array of card definitions, attempts to create each card using AnkiService,
 * and returns a summary of successful and failed operations.
 * @param args - The arguments for the tool, expected to match CreateCardsBatchArgumentsSchema.
 * @param ankiService - An instance of AnkiService.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleCreateCardsBatch(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  // Parse and validate the entire arguments object.
  const { cards } = CreateCardsBatchArgumentsSchema.parse(args);

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  // Process each card definition in the provided array.
  for (let i = 0; i < cards.length; i++) {
    const cardDef = cards[i]; // cardDef is now validated by the Zod schema.
    const { deckName, modelName, fields, tags = [] } = cardDef;

    try {
      // If the model is 'Cloze', validate the relevant field for cloze syntax.
      // Assumes the primary text field for cloze is named 'Text' or 'Front'.
      if (modelName.toLowerCase().includes(NOTE_TYPES.CLOZE.toLowerCase())) {
        const clozeTextFieldKey = Object.keys(fields).find(key =>
          key.toLowerCase() === 'text' || key.toLowerCase() === 'front'
        );
        const clozeTextFieldValue = clozeTextFieldKey ? fields[clozeTextFieldKey] : undefined;

        if (clozeTextFieldValue) {
          validateClozeText(clozeTextFieldValue, clozeTextFieldKey);
        } else {
          // Check if any field has cloze syntax if 'Text' or 'Front' is not explicitly found.
          const fieldWithCloze = Object.entries(fields).find(([key, value]) =>
            typeof value === 'string' && value.includes("{{c") && value.includes("}}")
          );
          if (!fieldWithCloze) {
            throw new AnkiError(
              `For Cloze model "${modelName}", a field (typically 'Text' or 'Front') must contain cloze syntax. None found or field not provided.`
            );
          }
          // If a field with cloze syntax is found but not named 'Text' or 'Front',
          // it will be passed as is. AnkiConnect will determine if it's valid for the model.
        }
      }

      // Add the note using AnkiService, which includes field validation against the model.
      const noteId = await ankiService.addNoteWithValidation({
        deckName,
        modelName,
        fields,
        tags,
      });
      results.push({ inputCardIndex: i, status: "success", noteId, modelNameUsed: modelName, deckName });
      successCount++;
    } catch (error: any) {
      // Catch errors during individual card creation (validation or AnkiConnect issues).
      const errorMessage = error instanceof AnkiError ? error.message : (error as Error).message || "Unknown error adding note";
      results.push({ inputCardIndex: i, status: "error", modelNameAttempted: modelName, deckName, message: errorMessage });
      failureCount++;
    }
  }

  // Prepare a summary message and detailed results.
  const summaryMessage = `Batch card creation complete. Processed ${cards.length} card(s). Succeeded: ${successCount}, Failed: ${failureCount}.`;
  // Providing results as a JSON string makes it easy for an AI to parse if needed.
  const resultsString = `Details (JSON):\n${JSON.stringify(results, null, 2)}`;

  return {
    content: [{ type: "text", text: { text: `${summaryMessage}\n\n${resultsString}` } }],
  };
}
