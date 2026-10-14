import { l, t, v } from "./helpers.js";

// From the "Interview" chat. Resume videos live on the Jobs board.
export default {
  slug: "interview",
  name: "Interview",
  stages: [
    {
      title: "1. Questions to practise",
      summary: "Real interview questions, with answers where I saved one.",
      items: [
        t(
          "CORS out of nowhere (staff backend)",
          "Your frontend is on localhost:3000 and your backend on localhost:8000. You have been coding for 4 hours and everything was working.\nYou changed nothing, then a CORS error appeared out of nowhere. Your teammate on the same codebase has no CORS error on their machine right now.\nSame code, ports and browser. Why are you getting it and they are not?"
        ),
        t(
          "AI engineer: no internet (Accenture)",
          "Our client is a bank. They want to run this AI on their private servers with zero internet access.\nHow do you build an AI that does not need the cloud?"
        ),
        t(
          "Crash at exactly 520 MB (senior backend)",
          "Your service crashes every time free memory drops below 520 MB. Not 519 MB. Not 521 MB. Exactly 520 MB.\nWhere do you start debugging?"
        ),
        t(
          "Crash at exactly 520 MB: answer",
          "An exact threshold like that hints at a configured limit or boundary condition somewhere.\nStart by checking: memory limits and cgroups, OOM killer events, JVM and heap settings, container resource configs, buffer allocation thresholds, hardcoded safety checks, autoscaling rules.\nVery precise numbers often point to infrastructure or configuration boundaries, not random bugs."
        ),
        t(
          "What interviewers ask now",
          "Today's interviewers ask about distributed systems trivia, ML concepts, LLM internals and agent design during interviews for companies like Airbnb, Google, Meta, OpenAI, xAI and Anthropic."
        ),
        l(
          "https://read.engineerscodex.com/p/every-dev-should-know-about-ai-sandboxes",
          "Every dev should know about AI sandboxes (Engineer's Codex)"
        ),
      ],
    },
    {
      title: "2. How to answer",
      summary: "Videos on answering well.",
      items: [
        v("https://youtu.be/Ti5vfu9arXQ", "", "How to answer in a Google interview"),
        v("https://www.youtube.com/watch?v=bBvPQZmPXwQ"),
        v("https://youtu.be/uGNSOFZb7Mo"),
      ],
    },
    {
      title: "3. System design",
      summary: "System design interview preparation.",
      items: [v("https://youtu.be/OvufRkoD-D0", "", "System design interview")],
    },
    {
      title: "4. Shorts and posts",
      summary: "Quick videos and posts saved for later.",
      items: [
        v("https://youtube.com/shorts/6bBodBjyg2M"),
        v("https://www.youtube.com/shorts/m3RLmKSHWaQ"),
        v("https://www.youtube.com/shorts/qEW9shE6AcA"),
        v("https://www.youtube.com/shorts/WsQq12cNxKI"),
        l("https://x.com/VaibhavSisinty/status/2102701247887556760", "Vaibhav Sisinty (X post)"),
        l(
          "https://www.linkedin.com/posts/vijay-chollangi-3230abcd12271_swipe-activity-7396734816123121665-1oXe",
          "Swipe post (Vijay Chollangi, LinkedIn)"
        ),
      ],
    },
  ],
};
