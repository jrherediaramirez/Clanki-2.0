// src/utils/guidelines.ts

/**
 * Pre-defined set of operational guidelines for an AI assistant
 * to effectively use Clanki 2.0 tools.
 */
export const CLANKI_OPERATIONAL_GUIDELINES_TEXT = `
// --- Clanki 2.0 Operational Guidelines ---

**Workflow for Card Creation:**

1. **Check User's Setup:**
   * Call \`get-model-names\` to see available note types.
   * For specialized content, call \`get-model-info\` on relevant custom types.
   * Inform user of applicable custom note types found.

2. **Tool Selection:**
   * **Batch Creation:** Use \`create-cards-batch\` for multiple cards from documents/lists.
   * **Single Cards:** Use \`create-dynamic-card\` (user specifies type) or \`smart-create-card\` (AI infers).
   * **Basic/Cloze:** Use \`create-card\` or \`create-cloze-card\` when explicitly requested for simplicity.

3. **Best Practices:**
   * Break complex content into logical, focused cards.
   * Map content accurately to custom note type fields (use \`get-model-info\` to understand fields).
   * Use relevant tags for organization.
   * Confirm deck name if not specified by the user.
   * For batch operations, summarize the plan before executing if appropriate.

**Key Rules:**
- Always check available note types first (\`get-model-names\`).
- Prefer specialized note types over 'Basic' when applicable and available.
- Use \`get-model-info\` to understand the fields of a specific note type before using \`create-dynamic-card\` for it.
- Use batch creation (\`create-cards-batch\`) for efficiency when dealing with multiple cards.
- Present errors clearly to the user with suggested solutions if possible.
- When using \`query-cards\`, be specific to avoid overly broad results.
- For \`smart-create-card\`, provide as much structured content as possible to aid inference.
`;
