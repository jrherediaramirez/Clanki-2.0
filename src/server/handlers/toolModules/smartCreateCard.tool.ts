// src/server/handlers/toolModules/smartCreateCard.tool.ts

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolResponse } from "../../../types/mcp.js";
import { AnkiService } from "../../../services/anki.js";
import { SmartCardCreationArgumentsSchema } from "../../../services/validation.js";
import { ModelInfo } from "../../../types/anki.js";
import { NOTE_TYPES } from "../../../utils/constants.js"; // Used by inferBestModelType
import { AnkiError } from "../../../utils/errors.js";

// Import the handler from createDynamicCard.tool.ts to reuse its logic
// Adjust the path if your file structure is different or if createDynamicCard.tool.ts is not yet created.
// For now, assuming it will be in the same directory:
import { handleCreateDynamicCard } from "./createDynamicCard.tool.js";


/**
 * Infers the best Anki model type based on the provided content keys and available models.
 * @param content - A record of content keys and values.
 * @param models - A record of available ModelInfo objects, keyed by model name.
 * @returns The name of the inferred best model type.
 */
function inferBestModelType(content: Record<string, string>, models: Record<string, ModelInfo>): string {
  const contentKeys = Object.keys(content).map(k => k.toLowerCase());
  let bestScore = -1;
  let bestModel: string = NOTE_TYPES.BASIC; // Default to Basic if no better match is found

  for (const [modelName, modelInfo] of Object.entries(models)) {
    if (!modelInfo || !Array.isArray(modelInfo.fields)) {
      // Skip if modelInfo or its fields are not properly defined
      continue;
    }
    let score = 0;
    const modelFields = modelInfo.fields.map(f => f.toLowerCase());

    // Score based on direct matches of content keys to model fields
    for (const contentKey of contentKeys) {
      if (modelFields.includes(contentKey)) {
        score += 2; // Strong match
      } else if (modelFields.some(f => f.includes(contentKey) || contentKey.includes(f))) {
        score += 1; // Partial match
      }
    }

    // Bonus if model name itself is hinted in content keys
    if (contentKeys.some(key => modelName.toLowerCase().includes(key))) {
      score += 0.5;
    }

    // Score based on the proportion of model fields that can be matched from content keys
    if (modelFields.length > 0) {
      const matchedFieldCount = modelFields.filter(mf =>
        contentKeys.some(ck => mf.includes(ck) || ck.includes(mf))
      ).length;
      score += (matchedFieldCount / modelFields.length) * 2; // Proportional score
    }

    if (score > bestScore) {
      bestScore = score;
      bestModel = modelName;
    }
  }
  return bestModel;
}

/**
 * Maps provided content to the fields of a given Anki model.
 * Tries direct matches first, then partial matches, then common aliases.
 * @param content - A record of content keys and values.
 * @param modelInfo - The ModelInfo object for the target model.
 * @returns A record of mapped field names to content values.
 */
function mapContentToFields(content: Record<string, string>, modelInfo: ModelInfo): Record<string, string> {
  const mapping: Record<string, string> = {};
  if (!modelInfo || !Array.isArray(modelInfo.fields)) {
    return mapping; // Return empty mapping if modelInfo or fields are invalid
  }

  const modelFieldNames = modelInfo.fields;
  const availableContentKeys = new Set(Object.keys(content));

  // Prioritize exact (case-insensitive) matches
  for (const modelField of modelFieldNames) {
    const modelFieldLower = modelField.toLowerCase();
    for (const contentKey of availableContentKeys) {
      if (modelFieldLower === contentKey.toLowerCase()) {
        mapping[modelField] = content[contentKey];
        availableContentKeys.delete(contentKey); // Mark content key as used
        break; // Move to the next model field
      }
    }
  }

  // Attempt partial matches for remaining model fields
  for (const modelField of modelFieldNames) {
    if (mapping[modelField]) continue; // Skip if already mapped

    const modelFieldLower = modelField.toLowerCase();
    let bestMatchKey: string | null = null;
    let highestScore = 0;

    for (const contentKey of availableContentKeys) {
      const contentKeyLower = contentKey.toLowerCase();
      let currentScore = 0;
      if (modelFieldLower.includes(contentKeyLower)) currentScore = contentKeyLower.length; // Longer substring match is better
      else if (contentKeyLower.includes(modelFieldLower)) currentScore = modelFieldLower.length;

      if (currentScore > highestScore) {
        highestScore = currentScore;
        bestMatchKey = contentKey;
      }
    }
    if (bestMatchKey) {
      mapping[modelField] = content[bestMatchKey];
      availableContentKeys.delete(bestMatchKey);
    }
  }

  // Attempt common aliases for essential fields if still unmapped
  const commonMappings: Record<string, string[]> = {
    "Front": ["question", "term", "frontside"],
    "Back": ["answer", "definition", "backside"],
    "Text": ["cloze_text", "cloze text", "main_content"], // For Cloze
  };

  for (const modelField of modelFieldNames) {
    if (mapping[modelField] || !commonMappings[modelField]) continue;

    for (const alias of commonMappings[modelField]) {
      const aliasLower = alias.toLowerCase();
      for (const contentKey of availableContentKeys) {
        if (aliasLower === contentKey.toLowerCase()) {
          mapping[modelField] = content[contentKey];
          availableContentKeys.delete(contentKey);
          break; // Found alias match for this model field
        }
      }
      if (mapping[modelField]) break; // Move to next model field if current one is mapped
    }
  }
  return mapping;
}

/**
 * Tool definition for intelligently creating a new Anki card.
 * It attempts to infer the best note type/model and map provided content to its fields.
 * Can also use a suggested note type if provided.
 */
export const smartCreateCardToolDefinition: Tool = {
  name: "smart-create-card",
  description: "Intelligently create a new card by attempting to infer the best note type/model and mapping provided content to its fields. Can also use a suggested note type.",
  inputSchema: {
    type: "object",
    properties: {
      deckName: {
        type: "string",
        description: "The name of the deck to add the card to",
        minLength: 1
      },
      content: {
        type: "object",
        additionalProperties: {
          type: "string"
        },
        description: "Key-value pairs of unstructured content to be mapped to card fields"
      },
      suggestedType: {
        type: "string",
        description: "Optional suggested note model/type for the card"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Optional tags for the new card"
      }
    },
    required: ["deckName", "content"]
  },
};

/**
 * Handles the execution of the smart-create-card tool.
 * @param args - The arguments for the tool, expected to match SmartCardCreationArgumentsSchema.
 * @param ankiService - An instance of AnkiService.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleSmartCardCreation(
  args: unknown,
  ankiService: AnkiService
): Promise<ToolResponse> {
  // Parse and validate arguments.
  const { deckName, content, suggestedType, tags = [] } = SmartCardCreationArgumentsSchema.parse(args);

  // Fetch all available model information from Anki.
  const allModels = await ankiService.getAllModelsInfo();
  if (Object.keys(allModels).length === 0) {
    throw new AnkiError("No Anki models found. Cannot perform smart card creation.");
  }

  let targetModelName = suggestedType;

  // Validate suggestedType if provided.
  if (targetModelName) {
    if (!allModels[targetModelName]) {
      return {
        content: [{
          type: "text",
          text: {
            text: `Suggested note type "${targetModelName}" not found. Available types: ${Object.keys(allModels).join(', ')}. Please try again or let the system infer the type.`
          }
        }],
      };
    }
  } else {
    // If no suggestedType, infer the best model.
    targetModelName = inferBestModelType(content, allModels);
    console.log(`Smart-create inferred model type: ${targetModelName}`); // For debugging
  }

  const targetModelInfo = allModels[targetModelName];
  if (!targetModelInfo) {
    // This case should ideally be caught by the suggestedType check or inferBestModelType returning a valid model.
    throw new AnkiError(`Could not determine or find a valid note type. Attempted type: "${targetModelName}".`);
  }

  // Map the provided content to the fields of the chosen model.
  const fieldMapping = mapContentToFields(content, targetModelInfo);

  if (Object.keys(fieldMapping).length === 0) {
    return {
      content: [{
        type: "text",
        text: {
          text: `Could not map any provided content to the fields of note type "${targetModelName}". Please check content keys or try a different note type/content.`
        }
      }],
    };
  }

  // Delegate the actual card creation to handleCreateDynamicCard.
  // This reuses the validation and creation logic, including cloze checks within handleCreateDynamicCard.
  // The arguments for handleCreateDynamicCard are passed as a single object.
  return handleCreateDynamicCard(
    {
      deckName,
      modelName: targetModelName,
      fields: fieldMapping,
      tags,
    },
    ankiService
  );
}
