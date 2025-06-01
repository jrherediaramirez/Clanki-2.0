import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { AnkiService } from "../services/anki.js";
import { getToolDefinitions, handleToolCall, listResources, readResource } from "./handlers/index.js";

export class AnkiServer {
  private server: Server;
  private ankiService: AnkiService;

  constructor() {
    this.ankiService = new AnkiService();
    this.server = new Server(
      {
        name: "anki-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return getToolDefinitions();
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await handleToolCall(name, args, this.ankiService);
    });

    // List available resources (Anki decks)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return await listResources(this.ankiService);
    });

    // Read resource content (deck contents)
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      return await readResource(request.params.uri, this.ankiService);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Anki MCP Server running on stdio");
  }
}