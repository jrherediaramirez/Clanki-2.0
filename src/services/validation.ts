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
}); // Removed the .refine() block