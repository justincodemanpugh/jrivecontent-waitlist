// Thin wrapper around the Anthropic SDK. Server-only.
//
// Deliberately shaped like lib/apify/tiktokScraper.js: one place that reads
// the token, throws a clear error when the deployment isn't configured, and
// pins the model so swapping it is a one-line change rather than a grep.
import Anthropic from "@anthropic-ai/sdk";

// The scan prompt is a short, well-specified extraction job with a strict
// tool schema, which is what Haiku is good at — and the /vibecode scan is a
// free, unauthenticated lead magnet, so per-call cost is the binding
// constraint. Move this to "claude-sonnet-5" if the video ideas read as
// generic; nothing else has to change.
export const SCAN_MODEL = "claude-haiku-4-5";

let client = null;

export function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic is not configured (ANTHROPIC_API_KEY missing).");
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}
