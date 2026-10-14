import { l, t, v } from "./helpers.js";

// From the "Vibe Coding" chat.
export default {
  slug: "vibe-coding",
  name: "Vibe Coding",
  stages: [
    {
      title: "1. Principles",
      summary: "How to build with AI without shipping fragile code.",
      items: [
        t(
          "Design before you build",
          "Before designing a feature, think about its architecture.\nWhat entities are there, and how does data flow? Clarify the design with the AI and find the areas that might be off."
        ),
        t(
          "Edge cases",
          "For every feature think about edge cases.\nUser submits a form twice within 500 ms: either disable on one click or use idempotency.\nUser session expires midway.\nIs every input non-empty and valid? What if it is called twice? What happens to downstream services?"
        ),
        t("Think like a hacker", "Think like a hacker trying to break into your own system."),
        t(
          "Questions to ask the AI",
          "When to use a cache\nWhen not to optimize\nWhen to add an index\nWhen to break a service apart\nWhen to push back on a product requirement"
        ),
        t(
          "Ask for cases, not code",
          "Instead of \"write me a function to implement rate limiting\", ask: \"give me three cases, along with when to use rate limiting\"."
        ),
      ],
    },
    {
      title: "2. Claude Code",
      summary: "Setups, skills and plugins.",
      items: [
        l("https://github.com/affaan-m/everything-claude-code", "everything-claude-code"),
        l(
          "https://share.google/9V3i5pYoiOE9rZuyv",
          "Free Claude Code setup: use Claude Code without a subscription (Medium)"
        ),
        l("https://github.com/rebelytics/one-skill-to-rule-them-all", "one-skill-to-rule-them-all (skills)"),
        v("https://www.youtube.com/shorts/bU5ZDdRnN2M", "Skills"),
      ],
    },
    {
      title: "3. UI tools",
      summary: "Components, design folders and design tools.",
      items: [
        l("https://21st.dev/community/components", "21st.dev community components"),
        l("https://drive.google.com/drive/folders/1m182p16V_mZBAOTO-0iq4T4-cj6O-hev", "Design resources (Drive folder)"),
        v("https://www.youtube.com/watch?v=Be5IAxyxa6g", "Beautiful apps in 3 prompts using Cursor 2.0"),
        v("https://youtube.com/shorts/yHvhgbhFaAs", "Stitch"),
      ],
    },
    {
      title: "4. Videos",
      summary: "Saved without a label.",
      items: [
        v("https://youtu.be/gcuR_-rzlDw"),
        v("https://youtube.com/shorts/oePhw5sGpPs"),
        v("https://youtu.be/QoQBzR1NIqI"),
        v("https://www.youtube.com/watch?v=OWZr4EzQkd8"),
        v("https://www.youtube.com/watch?v=BE6uj1COo8I"),
        v("https://youtu.be/NNv80mMzFDs"),
        v("https://youtube.com/shorts/6c3iJbeykr4"),
        v("https://youtube.com/shorts/6ZAnVF_BrVM"),
        v("https://youtube.com/shorts/fVCh-Y4ZNVQ"),
        v("https://www.youtube.com/watch?v=q_ZgvKJzV2k"),
        v("https://www.youtube.com/watch?v=l04YrKjFO9A"),
        v("https://www.youtube.com/watch?v=dkMWK37zxW0"),
        v("https://www.youtube.com/watch?v=7I3G21RyARs"),
      ],
    },
  ],
};
