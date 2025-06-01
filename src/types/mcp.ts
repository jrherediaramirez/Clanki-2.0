export interface ToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
}

export interface ResourceInfo {
  uri: string;
  name: string;
  description: string;
}

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}