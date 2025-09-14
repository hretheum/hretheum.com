// Vector store builder for intent detection
// See: docs/playbooks/intent_detector_dataset_and_ts_setup_UPDATED.md (section 2.3)

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { DATASET } from "./dataset";
import type { IntentExample } from "./intents";

let cachedStore: MemoryVectorStore | null = null;

export async function buildStore(): Promise<MemoryVectorStore> {
  if (cachedStore) return cachedStore;
  const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" });
  const docs: Document[] = DATASET.map((ex: IntentExample) => ({
    pageContent: ex.text,
    metadata: { intent: ex.intent },
  }));
  cachedStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  return cachedStore;
}

export function resetStoreCache() {
  cachedStore = null;
}
