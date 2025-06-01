export interface AnkiResponse<T> {
  result: T;
  error: string | null;
}

export interface AnkiCard {
  noteId: number;
  fields: {
    Front: { value: string };
    Back: { value: string };
    Hint?: { value: string };
    Text?: { value: string };
    "Back Extra"?: { value: string };
    [key: string]: { value: string } | undefined;
  };
  tags: string[];
}

export interface AnkiNote {
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags: string[];
}

export interface AnkiNoteInfo {
  noteId: number;
  modelName: string;
  tags: string[];
  fields: Record<string, { value: string; order: number }>;
}

export interface CreateCardArgs {
  deckName: string;
  front: string;
  back: string;
  hint?: string;
  tags?: string[];
}

export interface CreateClozeCardArgs {
  deckName: string;
  text: string;
  backExtra?: string;
  tags?: string[];
}

export interface UpdateCardArgs {
  noteId: number;
  front?: string;
  back?: string;
  tags?: string[];
}

export interface UpdateClozeCardArgs {
  noteId: number;
  text?: string;
  backExtra?: string;
  tags?: string[];
}

// New interfaces for additional functionality
export interface AnkiCardInfo {
  cardId: number;
  noteId: number;
  deckName: string;
  question: string;
  answer: string;
  modelName: string;
  fieldOrder: number;
  fields: Record<string, { value: string; order: number }>;
  tags: string[];
  note: number;
  type: number;
  queue: number;
  due: number;
  interval: number;
  factor: number;
  reviews: number;
  lapses: number;
  left: number;
  odue: number;
  odid: number;
  flags: number;
  data: string;
}

export interface DeckStats {
  deckName: string;
  totalCards: number;
  newCards: number;
  learningCards: number;
  dueCards: number;
  suspendedCards: number;
  buriedCards: number;
  averageInterval?: number;
  cardsAddedToday?: number;
}