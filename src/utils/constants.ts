export const ANKI_CONNECT_URL = "http://localhost:8765";
export const ANKI_CONNECT_HOST = "127.0.0.1";
export const ANKI_CONNECT_PORT = 8765;
export const ANKI_CONNECT_VERSION = 6;

export const DEFAULT_RETRIES = 3;
export const DEFAULT_DELAY = 1000;
export const CHUNK_SIZE = 5;

export const NOTE_TYPES = {
  BASIC: "Basic",
  CLOZE: "Cloze",
} as const;

export const ANKI_ACTIONS = {
  CREATE_DECK: "createDeck",
  ADD_NOTE: "addNote",
  UPDATE_NOTE_FIELDS: "updateNoteFields",
  REPLACE_TAGS: "replaceTags",
  DECK_NAMES: "deckNames",
  FIND_NOTES: "findNotes",
  NOTES_INFO: "notesInfo",
  DELETE_NOTES: "deleteNotes", // Add this line
} as const;