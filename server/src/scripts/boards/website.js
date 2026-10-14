import { l, t, v } from "./helpers.js";

// From the "Website" chat. Model picks and the Stitch short live on the AI Tools board,
// and the 100xDevs attendance assignment lives on the Web Terminologies board.
export default {
  slug: "website",
  name: "Website",
  stages: [
    {
      title: "1. Learning paths",
      summary: "What to learn first for full-stack work.",
      items: [
        v("https://www.youtube.com/watch?v=zG3hNL08Dro", "", "Priority 1: GenAI + full stack (Sheriyans)"),
        v(
          "https://www.youtube.com/watch?v=ozbAQXQov0E",
          "",
          "Priority 2: Next.js, SQL (Neon Postgres), event-driven architecture, SaaS starter template, Clerk, decoupled authentication"
        ),
        v("https://www.youtube.com/watch?v=Vh_NlF9hHN4", "", "For a one-shot"),
        v("https://www.youtube.com/watch?v=Ecygj87WhZs", "", "Full stack AI"),
        t(
          "Think in architecture decisions",
          "Stop asking \"how do I do this in Next.js\" and start asking \"what is the right way to approach this\". That shift takes you from executing tasks to owning architecture.\nDoes this data need to be fresh on every request, or can it be cached? Should this logic run on the server or the client? Are we streaming this or waiting for the whole page?"
        ),
      ],
    },
    {
      title: "2. React roadmap",
      summary: "What to know in React, grouped by topic.",
      items: [
        t(
          "Core",
          "State, components, rendering and props\nHooks: useState, useEffect, useCallback, useMemo, useRef\nDifference between useContext and useReducer\nImplement useMemo yourself\nWhat is a lifecycle? How does rendering work?"
        ),
        t(
          "Custom hooks",
          "Create some custom hooks, for example: get the todos of your todo application; a hook that hits the backend every 10 seconds and gives the latest data.\nWhen a hook changes, how does it re-render?"
        ),
        t(
          "State management",
          "Prop drilling, Context API and Suspense\nRedux to manage state a little better\nFor context management: Redux, Zustand (simple), TanStack Query for cache validation and data fetching\nNormalisation and denormalisation in the frontend"
        ),
        t(
          "App concerns",
          "Routing\nStyling\nTooling behind bootstrapping a React app\nPerformance improvement\nForms: React Hook Form, Formik (all form state managed)\nFetching content: React Query, SWR\nTesting: how to write tests"
        ),
        t(
          "Auth in React",
          "Auth libraries: Clerk, Auth0, Firebase\nHow to manage an authenticated user?\nWhen to authorize a user's data?\nHow to add tokens?\nHow much access to give an unauthenticated user?\nFull-stack routing validation for authenticated users."
        ),
        t(
          "TypeScript",
          "State management with discriminated unions\nTypes vs interfaces\nType-safe forms\nFull-stack type management, Zod\nProfiling and performance, Lighthouse"
        ),
        t(
          "Performance topics",
          "React virtualisation, react-window, compression, pagination, filters, query, search query."
        ),
        t(
          "useState with const",
          "With const counter, writing counter + 1 gives an error, but useState(counter + 1) does not. With let counter, counter + 1 gives no error."
        ),
        v("https://www.youtube.com/watch?v=lI7IIOWM0Mo", "", "About the const / useState note, at 20:47"),
      ],
    },
    {
      title: "3. React and JavaScript interviews",
      summary: "Common mistakes and interview questions.",
      items: [
        v("https://www.youtube.com/watch?v=GGo3MVBFr1A", "", "React hook mistake"),
        v("https://www.youtube.com/watch?v=-yIsQPp31L0", "All 12 useState and useEffect mistakes junior React developers still make in 2026"),
        v("https://www.youtube.com/watch?v=0cvp_yY-818", "", "Tanay Pratap"),
        v("https://www.youtube.com/watch?v=tOo9c6SK_do", "", "Tanay Pratap"),
        v("https://www.youtube.com/watch?v=k73AIk3mz2g", "", "A question on arrays (Chai aur Code)"),
        v("https://www.youtube.com/watch?v=UsNdgJY6tCY", "", "Production mistake in React (Chai aur Code)"),
        v("https://www.youtube.com/watch?v=uE925hp9KDk", "", "React interview question (Akshay Saini)"),
        l("https://dev.to/borzoomv/what-is-forwardref-in-react-and-how-to-use-it-properly-4h86", "What is forwardRef in React and how to use it properly"),
        v("https://www.youtube.com/shorts/ICNiJ9hgDEc", "", "React"),
      ],
    },
    {
      title: "4. APIs and design",
      summary: "API design questions and tools.",
      items: [
        l("https://github.com/public-apis/public-apis", "public-apis", "Link added from the name in the chat."),
        l("https://trpc.io/docs/quickstart", "tRPC quickstart"),
        v("https://www.youtube.com/watch?v=B43Bljf4vSk", "", "Reference for API development"),
        v("https://www.youtube.com/watch?v=_gQaygjm_hg", "Good APIs vs bad APIs: 7 tips for API design"),
        t(
          "Design flaw: paid and unpaid orders",
          "GET /api/v1/orders/paid and GET /api/v1/orders/unpaid. What is the flaw in this design, and how would you improve it using the correct parameter approach?\nBetter: GET /api/v1/orders?paid=true. The query parameter is optional: leave it out and you get all orders, otherwise you only get the paid or unpaid ones depending on the boolean."
        ),
        t(
          "CORS and server-to-server",
          "Why does CORS not apply to server-to-server communication?\nWhat actually protects those endpoints?"
        ),
        t("Pagination", "Pagination (topic to study)."),
      ],
    },
    {
      title: "5. Backend and Node",
      summary: "Courses and snippets for Node, Express and MongoDB.",
      items: [
        v("https://www.youtube.com/watch?v=VWQrqVtsR2E", "Complete backend course | beginner to advanced | Node.js, Express, MongoDB + vibe coding with AI"),
        v("https://www.youtube.com/watch?v=79F36yYEDyo", "", "Zomato clone"),
        v("https://www.youtube.com/watch?v=NQOAQP0mow0", "Learn a bank transaction system with Node.js, Express and MongoDB", "Sheriyans"),
        v("https://www.youtube.com/watch?v=rOpEN1JDaD0", "", "JS Mastery: first production-ready API"),
        v("https://www.youtube.com/watch?v=L3OmeClSiQ0", "", "Post scheduler"),
        v("https://www.youtube.com/watch?v=nIracKeqsFk", "", "Building a full backend portfolio"),
        v("https://www.youtube.com/watch?v=wdBCoRMMxto", "", "Node.js crash course (Coder's Gyan)"),
        v("https://www.youtube.com/watch?v=qG-PLm3APSs", "", "Advanced Node.js crash course (Mehul Mohan)"),
        v("https://www.youtube.com/watch?v=_BqkCRgCdng", "", "Image upload reference at 6:24"),
        l("https://www.youtube.com/playlist?list=PLu71SKxNbfoDqgPchmvIsL4hTnJIrtige", "Playlist"),
        l("https://share.google/aimode/y2iiG3j8MWhdXevtD", "Salt in bcryptjs"),
        l("https://share.google/aimode/g53CkKD6Ikyi89aVC", "Next.js with Mongoose: a different way to export"),
        l("https://chatgpt.com/share/6a2c3251-6b2c-83ee-9cb4-af6e7b2d4637", "Backend (ChatGPT conversation)"),
      ],
    },
    {
      title: "6. Projects and playlists",
      summary: "Project-based learning and open-source repos.",
      items: [
        v("https://www.youtube.com/watch?v=IyEyx2Cq-Ko", "Build a full-stack e-commerce app with TypeScript, Next.js, React, Redux and Node"),
        l("https://www.youtube.com/playlist?list=PLoGCmkbiCMvvoUDIICSeCqgku45Kq4WrJ", "Harkirat Singh project playlist"),
        l("https://github.com/100xDevs-hkirat", "100xDevs-hkirat"),
        l("https://github.com/100xdevs-cohort-2", "100xdevs-cohort-2"),
        l("https://github.com/code100x", "code100x"),
        l("https://github.com/code100x/cms", "code100x/cms"),
        v("https://www.youtube.com/watch?v=0WS5eq9fOYk"),
        v("https://www.youtube.com/watch?v=0IXQDsdCWpE", "", "Win in a hackathon (animation)"),
      ],
    },
    {
      title: "7. Frontend extras",
      summary: "JavaScript practice and saved shorts.",
      items: [
        l("https://javascript30.com", "JavaScript30"),
        l("https://www.freecodecamp.org/news/think-like-the-javascript-engine/", "Think like the JavaScript engine (freeCodeCamp)"),
        v("https://youtube.com/shorts/XNujD6WZq8w"),
        v("https://youtube.com/shorts/4n5qxQynIeU"),
        v("https://youtube.com/shorts/he-eOOk5nLw"),
        v("https://youtube.com/shorts/yIkKqWJptHs"),
        v("https://youtube.com/shorts/gaTbOpdbn30"),
      ],
    },
  ],
};
