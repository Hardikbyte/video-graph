import { l, t, v } from "./helpers.js";

// From the "AI Tools" chat (plus the model picks saved in the "Website" chat).
export default {
  slug: "ai-tools",
  name: "AI Tools",
  stages: [
    {
      title: "1. Start here",
      summary: "The main tool list and what to learn in AI.",
      items: [
        l("https://docs.google.com/document/d/1RrMBJ5eAAdjKjqdkWxtCRx76a8WZtOI80DDZEpnRg3Y/edit?tab=t.0", "AI tools (Google Doc)"),
        v("https://youtube.com/shorts/PfZxPSliTHA", "What to learn in AI"),
        l("https://www.datacamp.com/courses/working-with-the-openai-api", "Working with the OpenAI API (DataCamp)"),
      ],
    },
    {
      title: "2. Agents and frameworks",
      summary: "Agent projects and frameworks to study.",
      items: [
        l("https://github.com/ashishpatel26/500-AI-Agents-Projects", "500 AI Agents projects"),
        l("https://github.com/microsoft/agent-framework", "Microsoft agent-framework"),
        v("https://youtube.com/shorts/7pzvBzfhUVY"),
        v("https://youtube.com/shorts/IeoTyqZjqkA"),
        v("https://www.youtube.com/shorts/85YPzUpkLrk", "Claude plugin"),
      ],
    },
    {
      title: "3. Design and UI with AI",
      summary: "Design systems, prompts and skills for better front-end work.",
      items: [
        t(
          "getdesign.md",
          "A free site that lets you download the full design system for brands like Airbnb, Shopify, Stripe and Ferrari: fonts, colors, spacing and visual language."
        ),
        l("https://getdesign.md", "getdesign.md"),
        l("https://starterkit.getdesign.md/", "getdesign.md starter kit"),
        t("Prompt 1: accessibility", "Review this for contrast and accessibility. List any violations with exact fixes."),
        t("Prompt 2: responsive", "Generate desktop, tablet, and mobile versions."),
        t("Prompt 3: A/B ideas", "Suggest 2 A/B test variations of the hero section, each with a different angle."),
        v("https://youtube.com/shorts/I60U6fd_oUY"),
        l("https://www.tasteskill.dev/", "Taste Skill (better front-end design)"),
        l("https://github.com/xiaopu-ai/web-design", "xiaopu-ai/web-design"),
        l("https://github.com/DietrichGebert/ponytail", "DietrichGebert/ponytail"),
        v("https://youtube.com/shorts/sko781GfOOc", "Google Stitch"),
        v("https://www.youtube.com/shorts/d6waTw_LWrk", "Design good web UI with AI"),
      ],
    },
    {
      title: "4. Reverse engineering",
      summary: "Understanding an existing project from its code.",
      items: [
        l("https://www.gitreverse.com/", "gitreverse"),
        v("https://youtube.com/shorts/JC8jd6eTdDI"),
      ],
    },
    {
      title: "5. Free playgrounds and APIs",
      summary: "Places to use AI models for free.",
      items: [
        l("https://designarena.ai", "designarena.ai"),
        l("https://arena.ai", "arena.ai"),
        l("https://pinokio.co", "pinokio.co"),
        l("https://modal.com/pricing", "Modal (free API key)"),
      ],
    },
    {
      title: "6. Model picks",
      summary: "Which model to use for what.",
      items: [
        t(
          "Which model for what",
          "Kimi 2.6 or Stitch for UI.\nGLM 5.1 for backend.\nXiaomi MiMo for testing.\nMiniMax and DeepSeek overall."
        ),
      ],
    },
  ],
};
