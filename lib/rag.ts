// Shared RAG types and utilities
// Used by both API routes and CLI scripts

export type RAGVector = {
  id: string
  text: string
  metadata: Record<string, any>
  embedding: number[] | null
}

export type RAGIndex = {
  vectors: RAGVector[]
}
