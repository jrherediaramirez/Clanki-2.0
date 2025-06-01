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