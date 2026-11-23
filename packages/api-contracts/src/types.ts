export type Language = "en" | "hi" | "or";
export type SafetyLevel = "normal" | "emergency" | "restricted" | "injection";
export interface Citation {
  source_id: string;
  title: string;
  url: string | null;
  verified: boolean;
  label?: string;
  snippet?: string;
  score?: number;
}
export interface ChatRequest {
  session_id?: string | null;
  message: string;
  language: Language;
  use_rag: boolean;
  top_k?: number;
  persist?: boolean;
}
export interface ChatResponse {
  session_id: string;
  message_id: string;
  reply: string;
  language: Language;
  mode: "demo" | "real";
  safety_level: SafetyLevel;
  citations: Citation[];
  retrieval: { used: boolean; document_count: number };
  disclaimer: string;
  translation_notice?: string | null;
  snippets?: Citation[];
  latency_ms?: number;
  model_status?: string;
}
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  safety_level?: SafetyLevel;
  mode?: string;
}
export interface Session {
  id: string;
  title: string;
  language: Language;
  created_at: string;
  messages?: ChatMessage[];
}
export interface Preferences {
  display_name: string;
  language: Language;
  text_size: "normal" | "large" | "extra";
  high_contrast: boolean;
  reduced_motion: boolean;
  text_only: boolean;
  voice: boolean;
  persist_chats: boolean;
}
export interface Resource {
  id: string;
  name: string;
  type: string;
  description: string;
  notes: string;
  url: string;
  verified: boolean;
  phone: string | null;
}
export type ResourceInput = Omit<Resource, "id">;
export interface DocumentRecord {
  id: string;
  source_id: string;
  title: string;
  category: string;
  language: string;
  status: string;
  error?: string | null;
  synthetic: boolean;
  url: string | null;
  organization: string;
  verified: boolean;
  publication_date?: string | null;
  created_at: string;
  content?: string;
}
export interface UploadInput {
  file: Blob;
  filename: string;
  title: string;
  category: string;
  language: Language;
  url: string;
  organization: string;
  verified: boolean;
  publication_date?: string;
}
export interface Feedback {
  id: string;
  rating: number;
  message: string;
  language: string;
  synthetic: boolean;
  created_at: string;
}
export interface SafetyCase {
  id: string;
  question: string;
  language: string;
  category: string;
  expected: string;
  actual: string | null;
  passed: boolean | null;
  scope?: string;
}
export interface AnalyticRow {
  date: string;
  language: string;
  queries: number;
  retrieved: number;
  feedback: number;
}
export interface Overview {
  total_queries: number;
  indexed_documents: number;
  languages_supported: number;
  feedback_submissions: number;
  retrieval_success_rate: number;
  safety_test_pass_rate: number | null;
  data_type: string;
}
export interface Filters {
  q?: string;
  language?: string;
  category?: string;
  start?: string;
  end?: string;
  page?: number;
  page_size?: number;
}
export interface Storage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}
export interface AuthResult {
  access_token: string;
  role: string;
  mode: string;
}
export interface Api {
  mode: "demo" | "real";
  config(): Promise<{ demo_mode: boolean; provider_connected: boolean }>;
  login(
    email?: string,
    password?: string,
    admin?: boolean,
  ): Promise<AuthResult>;
  logout(): Promise<void>;
  chat(req: ChatRequest, technical?: boolean): Promise<ChatResponse>;
  sessions(): Promise<Session[]>;
  session(id: string): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  preferences(): Promise<Preferences>;
  savePreferences(prefs: Preferences): Promise<Preferences>;
  resources(): Promise<Resource[]>;
  saveResource(input: ResourceInput, id?: string): Promise<Resource>;
  deleteResource(id: string): Promise<void>;
  feedback(input: {
    rating: number;
    message: string;
    language: Language;
  }): Promise<Feedback>;
  feedbackList(): Promise<Feedback[]>;
  overview(): Promise<Overview>;
  analytics(
    filters?: Filters,
  ): Promise<{ rows: AnalyticRow[]; data_type: string }>;
  documents(filters?: Filters): Promise<DocumentRecord[]>;
  document(id: string): Promise<DocumentRecord>;
  upload(input: UploadInput): Promise<DocumentRecord>;
  index(id: string): Promise<DocumentRecord>;
  deleteDocument(id: string): Promise<void>;
  safetyTests(run?: boolean): Promise<SafetyCase[]>;
  providerHealth(): Promise<{ provider_connected: boolean; mode: string }>;
  resetDemo(): Promise<void>;
}
