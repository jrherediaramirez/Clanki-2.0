# Clanki 2.0 - Claude's Anki Integration

**Version:** 1.0.0

Clanki 2.0 is an MCP (Model Context Protocol) server designed to empower AI assistants, such as Claude, with the ability to seamlessly interact with Anki flashcard decks. This updated version incorporates significant code refactoring for enhanced readability and maintainability. Key improvements include more robust basic card creation with an optional "Hint" field and an efficient batch creation tool, enabling the submission of multiple card definitions in a single, consolidated request.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Setup](#setup)
- [Available Tools](#available-tools)
  - [create-deck](#create-deck)
  - [create-card](#create-card)
  - [create-cloze-card](#create-cloze-card)
  - [update-card](#update-card)
  - [update-cloze-card](#update-cloze-card)
  - [create-cards-batch](#create-cards-batch)
- [Development](#development)
- [License](#license)

## Features

- **Deck Management**: Create and manage Anki decks.
- **Basic Card Creation**: Generate standard flashcards with front, back, and an optional "Hint" field.
- **Cloze Deletion Cards**: Produce cards with cloze deletions for fill-in-the-blank style learning.
- **Batch Card Creation**: Efficiently create multiple cards (both basic and cloze types) in a single operation.
- **Card Updates**: Modify existing basic and cloze deletion cards.
- **Tagging**: Add and manage tags for better card organization.
- **Deck Inspection**: View deck contents and individual card information.
- **AnkiConnect Integration**: Leverages the AnkiConnect plugin for direct communication with a running Anki instance.

## Prerequisites

- Anki Desktop application installed and running.
- AnkiConnect Plugin installed within Anki.
- Node.js version 16 or higher.

## Installation

1.  **Clone the Repository**:
    ```bash
    git clone [https://github.com/yourusername/clanki.git](https://github.com/yourusername/clanki.git)
    cd clanki
    ```
    *(Note: Replace `yourusername` with the actual repository path if applicable.)*

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Build the Project**:
    ```bash
    npm run build
    ```

## Setup

1.  Ensure Anki is operational with the AnkiConnect plugin enabled.
2.  Configure your MCP client (e.g., Claude for Desktop) to connect to the Clanki server. Edit the client's configuration file (e.g., `claude_desktop_config.json`):

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
    Replace `/absolute/path/to/clanki` with the correct absolute path to your Clanki 2.0 project's `build` directory.

## Available Tools

This section details the tools Clanki 2.0 provides for interacting with Anki.

### `create-deck`
Creates a new Anki deck.
- **Parameters**:
  - `name` (string, required): The desired name for the new deck.

### `create-card`
Creates a new basic (front/back) flashcard.
- **Parameters**:
  - `deckName` (string, required): The name of the deck to which the card will be added.
  - `front` (string, required): The content for the front side of the card.
  - `back` (string, required): The content for the back side of the card.
  - `hint` (string, optional): An optional hint. (Requires a 'Hint' field in your Anki note type).
  - `tags` (array of strings, optional): A list of tags to apply to the card.

### `create-cloze-card`
Creates a new cloze-deletion flashcard.
- **Parameters**:
  - `deckName` (string, required): The name of the deck for the new card.
  - `text` (string, required): The main content containing cloze deletions (e.g., `The capital of {{c1::France}} is {{c2::Paris}}`).
  - `backExtra` (string, optional): Supplementary information to display on the card's back.
  - `tags` (array of strings, optional): A list of tags.

### `update-card`
Modifies an existing basic flashcard.
- **Parameters**:
  - `noteId` (number, required): The unique ID of the note to update.
  - `front` (string, optional): New content for the front side.
  - `back` (string, optional): New content for the back side.
  - `tags` (array of strings, optional): A new set of tags (replaces existing tags).

### `update-cloze-card`
Modifies an existing cloze deletion card.
- **Parameters**:
  - `noteId` (number, required): The unique ID of the note to update.
  - `text` (string, optional): New text with cloze deletions.
  - `backExtra` (string, optional): New supplementary information for the back.
  - `tags` (array of strings, optional): A new set of tags (replaces existing tags).

### `create-cards-batch`
Creates multiple flashcards (basic or cloze) in a single operation.
- **Parameters**:
  - `cards` (array, required): An array of card definition objects. Each object must include:
    - `deckName` (string, required): Deck name for the card.
    - `cardType` (string, required): Must be `"basic"` or `"cloze"`.
    - `front` (string, required for `cardType: "basic"`): Front content.
    - `back` (string, required for `cardType: "basic"`): Back content.
    - `hint` (string, optional for `cardType: "basic"`): Optional hint.
    - `text` (string, required for `cardType: "cloze"`): Cloze-deleted text.
    - `backExtra` (string, optional for `cardType: "cloze"`): Extra back content.
    - `tags` (array of strings, optional): Tags for the card.
- **Example `cards` Array**:
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
Development
To contribute to or modify the Clanki 2.0 server:

Make your desired changes within the src/ directory.
Rebuild the project using:
Bash

npm run build
For debugging purposes, you can use the MCP Inspector:
Bash

npx @modelcontextprotocol/inspector node build/index.js
License
This project is licensed under the ISC License.


Key improvements in this version:
-   **Version Number**: Added from your `package.json`.
-   **Polished Introduction**: More formal and descriptive.
-   **Table of Contents**: For easier navigation.
-   **Enhanced Features Section**: Using bullet points for better readability.
-   **Clearer Parameter Descriptions**: In the "Available Tools" section.
-   **License Section**: Added, reflecting the ISC license from your `package.json`.
-   **Consistent Formatting**: General improvements to markdown structure.

This should give your `README.md` a more structured and professional appearance.