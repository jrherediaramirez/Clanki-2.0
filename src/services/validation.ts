import { z } from "zod";

export const ListDecksArgumentsSchema = z.object({});

export const CreateDeckArgumentsSchema = z.object({
  name: z.string().min(1),
});

export const CreateCardArgumentsSchema = z.object({
  deckName: z.string(),
  front: z.string(),
  back: z.string(),
  hint: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const CreateClozeCardArgumentsSchema = z.object({
  deckName: z.string(),
  text: z.string(),
  backExtra: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateCardArgumentsSchema = z.object({
  noteId: z.number(),
  front: z.string().optional(),
  back: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateClozeCardArgumentsSchema = z.object({
  noteId: z.number(),
  text: z.string().optional(),
  backExtra: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const DeleteNoteArgumentsSchema = z.object({
  noteIds: z.array(z.number().positive("Note ID must be a positive number."))
             .min(1, "At least one Note ID must be provided."),
});

// Updated schema for query-cards arguments
export const QueryCardsArgumentsSchema = z.object({
  query: z.string().min(1, "Query string cannot be empty if provided.").optional()
    .describe("Raw Anki search query string (e.g., 'deck:default tag:leech is:due')."),
  deckName: z.string().optional()
    .describe("Exact name of the deck to search within."),
  tags: z.array(z.string()).optional()
    .describe("List of tags to filter by (all must be present)."),
  cardState: z.enum(["new", "learn", "due", "suspended", "buried"]).optional()
    .describe("Filter by card state (e.g., new, learn, due)."),
  addedInDays: z.number().positive().optional()
    .describe("Filter by cards added in the last X days."),
  frontContains: z.string().optional()
    .describe("Text contained in the 'Front' field (for Basic notes)."),
  backContains: z.string().optional()
    .describe("Text contained in the 'Back' field (for Basic notes)."),
  textContains: z.string().optional()
    .describe("Text contained in the 'Text' field (for Cloze notes)."),
  anyFieldContains: z.string().optional()
    .describe("Text contained in any field of the note."),
  noteModel: z.string().optional()
    .describe("Filter by a specific note model (e.g., 'Basic', 'Cloze').")
});

// New validation schemas for additional tools
export const DeleteDeckArgumentsSchema = z.object({
  deckName: z.string().min(1, "Deck name cannot be empty."),
});

export const GetDeckStatsArgumentsSchema = z.object({
  deckName: z.string().min(1, "Deck name cannot be empty."),
});

export const SuspendCardsArgumentsSchema = z.object({
  cardIds: z.array(z.number().positive("Card ID must be a positive number."))
             .min(1, "At least one Card ID must be provided."),
});

export const UnsuspendCardsArgumentsSchema = z.object({
  cardIds: z.array(z.number().positive("Card ID must be a positive number."))
             .min(1, "At least one Card ID must be provided."),
});

export const GetCardInfoArgumentsSchema = z.object({
  cardIds: z.array(z.number().positive("Card ID must be a positive number."))
             .min(1, "At least one Card ID must be provided."),
});

// New Schemas for Model/Note Type Operations and Dynamic Card Creation
export const GetModelInfoArgumentsSchema = z.object({
  modelName: z.string().min(1, "Model name cannot be empty."),
});

export const CreateDynamicCardArgumentsSchema = z.object({
  deckName: z.string().min(1, "Deck name cannot be empty."),
  modelName: z.string().min(1, "Model name cannot be empty."),
  fields: z.record(z.string(), z.string())
    .refine(obj => Object.keys(obj).length > 0, {
      message: "Fields object cannot be empty.",
    }),
  tags: z.array(z.string()).optional(),
});

export const SmartCardCreationArgumentsSchema = z.object({
    deckName: z.string().min(1, "Deck name cannot be empty."),
    content: z.record(z.string(), z.string())
        .refine(obj => Object.keys(obj).length > 0, {
            message: "Content object cannot be empty.",
        })
        .describe("Key-value pairs of unstructured content to be mapped to card fields."),
    suggestedType: z.string().optional()
        .describe("Optional suggested note model/type for the card."),
    tags: z.array(z.string()).optional()
        .describe("Optional tags for the new card."),
});