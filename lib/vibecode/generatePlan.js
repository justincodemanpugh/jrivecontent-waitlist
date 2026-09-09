// One model call: app facts in, a creator-marketing plan out.
//
// The plan is the product demo on /vibecode, so the prompt is deliberately
// opinionated rather than generic — it encodes the same advice we give in
// content/reddit/09 and /10 (native small-creator video beats polished ad
// spots, apps and games need different formats, briefs not scripts).
//
// niche_tags are constrained to CREATOR_NICHES because they are used as a
// literal filter against discovered_creators.niche_tags in matchCreators.js.
// A hallucinated niche returns zero creators, so the schema pins the enum
// rather than trusting the prompt.
import { createAnthropicClient, SCAN_MODEL } from "@/lib/ai/client";
import { CREATOR_NICHES } from "@/lib/onboarding/creatorConstants";

const VIDEO_IDEA_COUNT = 5;

const SYSTEM = `You plan TikTok UGC campaigns for small app developers — usually one person who built the app themselves and has no marketing budget.

How this channel actually works, and what your ideas must reflect:
- The creators are small (1k-100k followers) and post constantly. They are paid a flat ~$40 per video, not a retainer. They are not actors and not an agency.
- The winning video looks like a normal post from that creator, not an ad. Problem-then-app-solving-it in 15 seconds, or a POV of someone using it. Native beats polished.
- Most videos do a few hundred views. The campaign works because one in ten or twenty lands. So the ideas should be varied shots on goal, not five variations of one concept.
- For a game, the clip has to be genuinely fun gameplay with trend audio. Nobody watches a person talk about a game's features.
- The creator gets a one-page brief and reference videos, never a script.

Write hooks as the actual first line of the video, in the creator's voice. Be specific to this app — never "showcase the key features".`;

const PLAN_TOOL = {
  name: "emit_plan",
  description: "Return the creator-marketing plan for the app that was described.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "audience", "is_game", "niche_tags", "keywords", "video_ideas", "outreach_angle"],
    properties: {
      summary: {
        type: "string",
        description: "One sentence, plain English, on what the app does for the person using it.",
      },
      audience: {
        type: "string",
        description: "One sentence on who actually uses this app — be concrete about the person.",
      },
      is_game: {
        type: "boolean",
        description: "True if this is a game, which changes the video format entirely.",
      },
      niche_tags: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        description: "The creator niches whose audiences overlap this app's users, best match first.",
        items: { type: "string", enum: CREATOR_NICHES },
      },
      keywords: {
        type: "array",
        minItems: 3,
        maxItems: 6,
        description:
          "Short TikTok search phrases that would surface creators making content for this app's audience. Two to four words each, lowercase, no hashtags.",
        items: { type: "string" },
      },
      video_ideas: {
        type: "array",
        minItems: VIDEO_IDEA_COUNT,
        maxItems: VIDEO_IDEA_COUNT,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["hook", "format", "why"],
          properties: {
            hook: {
              type: "string",
              description: "The literal opening line of the video, in the creator's own voice.",
            },
            format: {
              type: "string",
              description: "What happens on screen, in one or two sentences. Concrete shots.",
            },
            why: {
              type: "string",
              description: "One sentence on why this angle earns the watch-through for this app.",
            },
          },
        },
      },
      outreach_angle: {
        type: "string",
        description:
          "Two sentences the developer can paste when messaging a creator, explaining why this app suits that creator's audience.",
      },
    },
  },
};

function userPrompt({ name, description, category, source }) {
  const lines = [
    `App name: ${name}`,
    category ? `App Store category: ${category}` : null,
    source === "web"
      ? "Source: the app's own website (not a store listing), so the description may be marketing copy."
      : "Source: its App Store listing.",
    "",
    "Description:",
    description || "(no description available — infer what you can from the name and category)",
  ];
  return lines.filter(Boolean).join("\n");
}

// A plan that is structurally fine but empty of specifics is worse than no
// tool at all, so callers get a hard failure rather than filler.
function assertUsable(plan) {
  if (!plan || typeof plan !== "object") throw new Error("Model returned no plan.");
  if (!Array.isArray(plan.video_ideas) || plan.video_ideas.length === 0) {
    throw new Error("Model returned no video ideas.");
  }
  if (!Array.isArray(plan.niche_tags) || plan.niche_tags.length === 0) {
    throw new Error("Model returned no niche tags.");
  }
  // strict:true pins the enum, but the tags are about to be used as a
  // database filter, so verify rather than trust.
  const allowed = new Set(CREATOR_NICHES);
  plan.niche_tags = plan.niche_tags.filter((t) => allowed.has(t));
  if (plan.niche_tags.length === 0) {
    throw new Error("Model returned no usable niche tags.");
  }
  return plan;
}

export async function generatePlan(app) {
  const client = createAnthropicClient();

  const response = await client.messages.create({
    model: SCAN_MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    tools: [PLAN_TOOL],
    // The only acceptable output here is the structured plan — there is no
    // conversational half of this call.
    tool_choice: { type: "tool", name: PLAN_TOOL.name },
    messages: [{ role: "user", content: userPrompt(app) }],
  });

  // Escaping inside tool inputs varies by model; always read the parsed
  // object rather than matching on the serialized string.
  const block = response.content.find(
    (b) => b.type === "tool_use" && b.name === PLAN_TOOL.name,
  );
  if (!block) {
    throw new Error("Model did not return a plan.");
  }
  return assertUsable(block.input);
}
