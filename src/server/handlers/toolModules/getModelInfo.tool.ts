// src/server/handlers/toolModules/getModelInfo.tool.ts

// Import necessary types and services
// Tool type for defining the tool structure.
import { Tool } from "@modelcontextprotocol/sdk/types.js";
// ToolResponse for the expected output structure.
import { ToolResponse } from "../../../types/mcp.js";
// AnkiService for interacting with AnkiConnect.
import { AnkiService } from "../../../services/anki.js";
// GetModelInfoArgumentsSchema for validating input arguments.
import { GetModelInfoArgumentsSchema } from "../../../services/validation.js";
// ModelInfo type for typing the result from ankiService.getModelInfo.
import { ModelInfo } from "../../../types/anki.js";

/**
 * Tool definition for retrieving detailed information about a specific Anki note type/model.
 * This includes its fields, templates, and CSS styling.
 */
export const getModelInfoToolDefinition: Tool = {
  name: "get-model-info",
  description: "Get detailed information about a specific note type/model, including its fields and templates.",
  inputSchema: {
    type: "object",
    properties: {
      modelName: {
        type: "string",
        description: "The name of the model to get information about",
        minLength: 1
      }
    },
    required: ["modelName"]
  },
};

/**
 * Handles the execution of the get-model-info tool.
 * It parses the modelName argument, calls the AnkiService to fetch detailed information
 * for that model, and returns the information in a formatted string.
 * @param args - The arguments for the tool, expected to match GetModelInfoArgumentsSchema.
 * @param ankiService - An instance of AnkiService.
 * @returns A Promise resolving to a ToolResponse.
 */
export async function handleGetModelInfo(
  args: unknown, // Input arguments are parsed by Zod.
  ankiService: AnkiService
): Promise<ToolResponse> {
  // Parse and validate arguments. Zod throws an error if validation fails.
  const { modelName } = GetModelInfoArgumentsSchema.parse(args);

  // Call the AnkiService to get detailed information about the specified model.
  const modelInfo: ModelInfo = await ankiService.getModelInfo(modelName);

  // Format the model information for a user-friendly response.
  // This includes model name, type (standard/cloze), fields, templates, and CSS.
  let infoText = `Note Type/Model: ${modelInfo.modelName}\n`;
  infoText += `Type: ${modelInfo.isCloze ? 'Cloze Deletion' : 'Standard (Basic, etc.)'}\n\n`;

  infoText += `Fields (${modelInfo.fields.length}):\n`;
  if (modelInfo.fields.length > 0) {
    infoText += modelInfo.fields.map((field, index) => `  ${index + 1}. ${field}`).join('\n') + '\n\n';
  } else {
    infoText += "  (No fields defined for this model)\n\n";
  }

  infoText += `Templates (${modelInfo.templates.length}):\n`;
  if (modelInfo.templates.length > 0) {
    infoText += modelInfo.templates.map((template, index) => {
      // Provide a snippet of the question (qfmt) and answer (afmt) formats.
      const qfmtSnippet = template.qfmt.length > 60 ? template.qfmt.substring(0, 57) + "..." : template.qfmt;
      const afmtSnippet = template.afmt.length > 60 ? template.afmt.substring(0, 57) + "..." : template.afmt;
      return `  ${index + 1}. Name: "${template.name}"\n     Q-Format: ${qfmtSnippet}\n     A-Format: ${afmtSnippet}`;
    }).join('\n\n') + '\n\n';
  } else {
    infoText += "  (No templates defined for this model)\n\n";
  }

  infoText += `CSS Styling:\n`;
  if (modelInfo.css && modelInfo.css.trim() !== "") {
    // Display a snippet of the CSS if it's long.
    const cssSnippet = modelInfo.css.length > 300 ? modelInfo.css.substring(0, 297) + "..." : modelInfo.css;
    infoText += `  ${cssSnippet}`;
  } else {
    infoText += "  (Uses default Anki styling - no custom CSS for this model)";
  }

  return {
    content: [
      {
        type: "text",
        text: { text: infoText.trim() },
      },
    ],
  };
}
