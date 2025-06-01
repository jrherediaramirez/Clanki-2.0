# Clanki 2.0: Your AI's Supercharged Bridge to Anki! 🚀

**Version:** 1.0.0 (Project "Clanki", MCP Server "anki-server")

Unleash the full potential of your Anki flashcard collection with **Clanki 2.0**! This Model Context Protocol (MCP) server empowers AI assistants like Claude to seamlessly and intelligently interact with your Anki desktop application.

This major update not only includes significant code refactoring for enhanced readability and maintainability but also introduces a suite of powerful new tools. Now, managing decks, controlling study sessions, and gaining deep insights into your learning progress is more intuitive and powerful than ever!

## ✨ Unlock Anki's Full Potential with Your AI!

Clanki 2.0 transforms how your AI assistant can support your learning journey:

* **Comprehensive Deck Management**: Create, **DELETE**, and get detailed **STATISTICS** for your Anki decks.
* **Masterful Card Creation**: Generate standard flashcards (with front, back, and optional "Hint" fields), create intricate cloze deletion cards, and perform **BATCH card creation** for ultimate efficiency.
* **Precision Card Control**: Update existing cards, **DELETE specific notes**, and now get **DETAILED INFORMATION** on individual cards, including their learning status, review history, and scheduling.
* **Dynamic Study Flow Customization**: **SUSPEND** and **UNSUSPEND** cards on demand, giving you granular control over your study queue.
* **Advanced Querying & Organization**: Pinpoint any card with surgical precision using rich search criteria—by deck, tags, content, card state, or even raw Anki query syntax.
* **Robust Tagging Capabilities**: Effortlessly add and manage tags for superior card organization.
* **Seamless AnkiConnect Integration**: Relies on the AnkiConnect plugin for direct and reliable communication with your running Anki instance.
* **Built for AI Assistants**: Designed as an MCP server for smooth integration with tools like Claude.

## 🆕 What's New in This Major Update?

Clanki 2.0 rolls out with game-changing new functionalities:

* 🆕 **`delete-deck`**: Securely delete entire decks.
* 🆕 **`get-deck-stats`**: Instantly retrieve vital statistics about your decks.
* 🆕 **`get-card-info`**: Dive deep into the specifics of individual cards.
* 🆕 **`suspend-cards`**: Temporarily pause cards from your review sessions.
* 🆕 **`unsuspend-cards`**: Bring suspended cards back into play.
* 🔧 **Code Refinements**: Significant internal improvements for a more stable and maintainable server.

## ✅ Prerequisites

Before you begin, ensure you have the following:

* Anki Desktop application installed and **running**.
* AnkiConnect Plugin installed within Anki.
* Node.js **version 18 or higher**.

## 🛠️ Installation & Setup

Get Clanki 2.0 up and running in a few simple steps:

1.  **Clone the Repository**:
    ```bash
    git clone [https://github.com/yourusername/clanki.git](https://github.com/yourusername/clanki.git) # <-- IMPORTANT: Replace with your actual repository URL!
    cd clanki
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Build the Project**:
    ```bash
    npm run build
    ```

4.  **Configure Your MCP Client**:
    To connect Clanki 2.0 with your AI assistant (e.g., Claude for Desktop), edit your client's MCP configuration file (often a JSON file like `claude_desktop_config.json`):

    ```json
    {
      "mcpServers": {
        "clanki": {
          "command": "node",
          "args": ["/absolute/path/to/clanki/build/index.js"]
        }
      }
    }
    ```
    **Crucially, replace `/absolute/path/to/clanki` with the correct absolute path to your Clanki 2.0 project's `build` directory on your system.**

5.  **Start Anki**: Ensure Anki is running with AnkiConnect enabled before starting your MCP client.

## 🧰 Available Tools

Clanki 2.0 provides a comprehensive suite of tools to interact with Anki.
*(Remember: Deck names are often case-sensitive in Anki and therefore in Clanki operations!)*

---

### `create-deck`
Creates a new Anki deck.
* **Parameters**:
    * `name` (string, required): The desired name for the new deck. (Case-sensitive)

---

### `delete-deck`
Permanently deletes an Anki deck and all its cards.
⚠️ **Warning**: This action is irreversible. Proceed with caution!
* **Parameters**:
    * `deckName` (string, required): The **case-sensitive** name of the deck to delete.

---

### `get-deck-stats`
Retrieves statistics for a specified deck.
* **Parameters**:
    * `deckName` (string, required): The name of the deck (case-sensitive).
* **Returns**: Information like total cards, new cards, cards in learning, cards due, etc.

---

### `create-card`
Creates a new basic (front/back) flashcard.
* **Parameters**:
    * `deckName` (string, required): The name of the deck for the card.
    * `front` (string, required): Content for the front side.
    * `back` (string, required): Content for the back side.
    * `hint` (string, optional): An optional hint. (Your Anki note type must have a 'Hint' field).
    * `tags` (array of strings, optional): Tags to apply.

---

### `create-cloze-card`
Creates a new cloze-deletion flashcard.
* **Parameters**:
    * `deckName` (string, required): The name of the deck.
    * `text` (string, required): Main content with cloze deletions (e.g., `The capital of {{c1::France}} is {{c2::Paris}}`).
    * `backExtra` (string, optional): Supplementary info for the card's back.
    * `tags` (array of strings, optional): Tags to apply.

---

### `update-card`
Modifies an existing basic flashcard (identified by its Note ID).
* **Parameters**:
    * `noteId` (number, required): The unique ID of the **note** to update.
    * `front` (string, optional): New content for the front.
    * `back` (string, optional): New content for the back.
    * `tags` (array of strings, optional): New set of tags (replaces existing ones).

---

### `update-cloze-card`
Modifies an existing cloze deletion card (identified by its Note ID).
* **Parameters**:
    * `noteId` (number, required): The unique ID of the **note** to update.
    * `text` (string, optional): New text with cloze deletions.
    * `backExtra` (string, optional): New supplementary back info.
    * `tags` (array of strings, optional): New set of tags (replaces existing ones).

---

### `delete-note`
Deletes one or more Anki notes (and all their associated cards) based on their unique Note IDs.
* **Parameters**:
    * `noteIds` (array of numbers, required): An array of **Note IDs** to be deleted.
* **Example Request**:
    ```json
    {
      "tool_name": "delete-note",
      "arguments": {
        "noteIds": [1609326101383, 1609326102805]
      }
    }
    ```

---

### `get-card-info`
Fetches detailed information about specific Anki cards (identified by their Card IDs).
*A single Anki Note can have multiple Cards (e.g., forward/reverse, or for different cloze deletions). This tool targets specific Card IDs.*
* **Parameters**:
    * `cardIds` (array of numbers, required): An array of **Card IDs** to retrieve information for.
* **Returns**: Details such as Card ID, Deck, Status (new, learning, due, suspended), Interval, Due dates, Reviews, Lapses, Factor for each card.

---

### `suspend-cards`
Suspends one or more Anki cards, removing them from the learning queue until unsuspended.
* **Parameters**:
    * `cardIds` (array of numbers, optional): An array of **Card IDs** to suspend.
    * `query` (string, optional): An Anki search query to select cards for suspension (e.g., `tag:difficult deck:"Medical Finals"`).
    * *(Note: You must provide either `cardIds` or a `query`.)*

---

### `unsuspend-cards`
Unsuspends one or more Anki cards, returning them to their previous state in the learning queue.
* **Parameters**:
    * `cardIds` (array of numbers, optional): An array of **Card IDs** to unsuspend.
    * `query` (string, optional): An Anki search query to select cards for unsuspension.
    * *(Note: You must provide either `cardIds` or a `query`.)*

---

### `query-cards`
Searches for Anki cards using a wide array of criteria. Returns detailed information for found notes.
* **Parameters (combine as needed; if `query` is absent, others are ANDed):**
    * `query` (string, optional): A raw Anki search query string (e.g., `deck:default tag:leech is:due -tag:hard`). This offers maximum flexibility.
    * `deckName` (string, optional): Exact name of the deck.
    * `tags` (array of strings, optional): List of tags (all must be present).
    * `cardState` (string, optional): Filter by card state (`"new"`, `"learn"`, `"due"`, `"suspended"`, `"buried"`).
    * `addedInDays` (number, optional): Cards added in the last X days.
    * `frontContains` (string, optional): Text in 'Front' field (Basic notes).
    * `backContains` (string, optional): Text in 'Back' field (Basic notes).
    * `textContains` (string, optional): Text in 'Text' field (Cloze notes).
    * `anyFieldContains` (string, optional): Text in any field of the note.
    * `noteModel` (string, optional): Filter by note model name (e.g., "Basic", "Cloze").
* **Example (Individual Parameters)**:
    ```json
    {
      "tool_name": "query-cards",
      "arguments": {
        "deckName": "Pharmacology",
        "tags": ["antibiotics"],
        "cardState": "new",
        "anyFieldContains": "penicillin"
      }
    }
    ```
* **Example (Direct Query)**:
    ```json
    {
      "tool_name": "query-cards",
      "arguments": {
        "query": "deck:\\"Advanced Concepts\\" (tag:chapter1 OR tag:chapter2) is:due -is:suspended \\"search term\\""
      }
    }
    ```

---

### `create-cards-batch`
Creates multiple flashcards (basic or cloze) in a single, efficient operation.
* **Parameters**:
    * `cards` (array, required): An array of card definition objects. Each object must include:
        * `deckName` (string, required): Deck name for the card.
        * `cardType` (string, required): Must be `"basic"` or `"cloze"`.
        * `front` (string, required for `cardType: "basic"`): Front content.
        * `back` (string, required for `cardType: "basic"`): Back content.
        * `hint` (string, optional for `cardType: "basic"`): Optional hint.
        * `text` (string, required for `cardType: "cloze"`): Cloze-deleted text.
        * `backExtra` (string, optional for `cardType: "cloze"`): Extra back content.
        * `tags` (array of strings, optional): Tags for the card.
* **Example `cards` Array**:
    ```json
    [
      {
        "deckName": "Language Learning",
        "cardType": "basic",
        "front": "Apple",
        "back": "Manzana",
        "hint": "A common fruit",
        "tags": ["spanish", "fruit", "noun"]
      },
      {
        "deckName": "Science Facts",
        "cardType": "cloze",
        "text": "Water is composed of {{c1::Hydrogen}} and {{c2::Oxygen}}.",
        "tags": ["chemistry", "molecules"]
      }
    ]
    ```

---

## 🚀 Development & Contribution

Want to enhance Clanki 2.0 or tailor it to your needs?

1.  Make your changes within the `src/` directory.
2.  Rebuild the project:
    ```bash
    npm run build
    ```
3.  For debugging and inspecting MCP interactions, use the MCP Inspector:
    ```bash
    npx @modelcontextprotocol/inspector node build/index.js
    ```

Contributions and suggestions are welcome!

## 📜 License

This project is licensed under the **ISC License**.