// Optional LLM-based reranker/adjudicator for close intents
// References: docs/playbooks/intent_detector_dataset_and_ts_setup_UPDATED.md (section 2.5)

import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import type { IntentId } from "./intents";

const schema = z.object({
  final_intent: z.string(),
  reason: z.string(),
});

const parser = StructuredOutputParser.fromZodSchema(schema);

const SYSTEM_PROMPT = `You are an intent adjudicator for interview conversations.
Given the candidate's message and two candidate intents, decide which is correct.
Prefer compliance > process.assignment_brief > assets.assets_request > logistics.compensation > retrieval_core.case_study in ties.
Respond in JSON.`;

export async function rerankWithLLM(
  userText: string,
  intents: { id: IntentId; score: number }[]
): Promise<{ final_intent: string; reason: string }> {
  const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });
  const top2 = intents.slice(0, 2).map((i) => i.id).join(" vs ");
  const prompt = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Text: ${userText}\nCandidates: ${top2}\n${parser.getFormatInstructions()}`,
    },
  ] as any;

  const res = await llm.invoke(prompt);
  const out = await parser.parse(res.content as string);
  return out; // { final_intent, reason }
}
