import { l, t, v } from "./helpers.js";

// From the "Web terminologies (Web Sockets)" chat. About 20 photos of notes were attached
// to that chat; the image files are not in chat-data, so they are not on this board.
export default {
  slug: "web-terminologies",
  name: "Web Terminologies",
  stages: [
    {
      title: "1. Concepts",
      summary: "My own explanations of web basics.",
      items: [
        t(
          "HTTP caching",
          "When a browser makes a request, the server may return a response along with caching headers such as Cache-Control (which includes a max-age or TTL), ETag, or Last-Modified. The browser stores this response in its cache. As long as the cached data is still fresh (within the max-age), the browser uses it directly without contacting the server. Once the cache becomes stale (after the TTL expires), the browser sends a conditional request using validators like If-None-Match (based on the ETag) or If-Modified-Since. The server then checks whether the resource has changed: if it has not, it responds with 304 Not Modified, so the browser reuses the cached data; if it has, the server returns a new 200 OK response with updated data, which replaces the old cache."
        ),
        t(
          "Symmetric vs asymmetric encryption",
          "Symmetric encryption uses a single shared key for both encryption and decryption, so the sender and receiver must both have the same secret key. It is fast and efficient, which makes it ideal for large amounts of data (for example AES). The major challenge is sharing the key securely beforehand.\nAsymmetric encryption uses a pair of mathematically related keys: a public key (shared openly) and a private key (kept secret). Data encrypted with the public key can only be decrypted with the private key, which enables secure communication without prior key exchange (for example RSA). It is better for key distribution and digital signatures, but slower, so real systems often use it alongside symmetric encryption."
        ),
        t(
          "TLS: doubt",
          "Doubt on this: in TLS, do not use asymmetric encryption for everything, because its computational cost is higher."
        ),
        t(
          "Server-Sent Events (SSE)",
          "SSE lets a server push real-time updates to a client over a single, long-lived HTTP connection. The client uses the EventSource API to receive a continuous stream of text-based messages without repeatedly requesting data. It is lightweight, reconnects automatically if the connection drops, and is ideal for live notifications, stock updates or news feeds. Unlike WebSockets it is one-way (server to client only) and simpler to implement when you only need real-time updates."
        ),
        t(
          "RPC and tRPC",
          "RPC (Remote Procedure Call) lets a program run a function on a remote server as if it were a local call. It hides the network communication, so you do not handle requests and responses by hand. Examples: gRPC and JSON-RPC.\ntRPC (TypeScript RPC) is a modern RPC framework for TypeScript apps. It gives end-to-end type safety between client and server without a separate API schema (like REST or GraphQL): you call backend functions from the frontend and keep the full types."
        ),
        t(
          "Where RPC and tRPC are used",
          "RPC is heavily used in large-scale backend systems and infrastructure.\ntRPC is popular in modern TypeScript web development for its simplicity and type safety.\nRPC examples: gRPC in microservices (Google, Netflix), JSON-RPC in blockchain (Ethereum APIs), backend service-to-service communication.\ntRPC examples: Next.js full-stack apps, type-safe APIs in React + TypeScript projects, internal tools and dashboards."
        ),
        t(
          "GraphQL N+1 problem",
          "The N+1 problem happens when a query causes many unnecessary database or API calls instead of fetching data in batches.\nExample: you query a list of users (1 query), then for each user you fetch their posts (N separate queries). With 10 users the server makes 1 + 10 = 11 queries.\nIt happens because GraphQL resolvers often run independently, so each field (like posts) triggers its own fetch.\nWhy it is bad: slower performance, more database load, poor scalability.\nCommon fix: use a tool like DataLoader to batch and cache requests, so all the related data comes from one optimized query."
        ),
        t(
          "Authentication vs authorization",
          "Authentication comes from the token.\nAuthorization comes from the database."
        ),
      ],
    },
    {
      title: "2. Reading and videos",
      summary: "Sources behind the notes.",
      items: [
        v("https://youtu.be/0yw-z6f7Mb4", "", "Piyush Garg"),
        l("https://www.geeksforgeeks.org/computer-networks/working-of-ssl/", "Working of SSL (GeeksforGeeks)"),
        l("https://share.google/2nEOreFGwm1qQvUrR", "What is Transport Layer Security (TLS)? (Cloudflare)"),
        l("https://share.google/yK7tN607ydon8WkB3", "Cloudflare", "Replit also uses this."),
        v("https://youtu.be/WtkKwO1viI8", "", "GraphQL"),
        v("https://www.youtube.com/watch?v=_lTECv25N2U", "", "Authentication"),
      ],
    },
    {
      title: "3. WebSockets",
      summary: "Scaling WebSockets, plus Socket.io docs.",
      items: [
        l(
          "https://docs.google.com/document/d/1QP6Vmk8FO15cxpyxdPKZnXCFMTZug-a6ccAVHbKj7wA/edit?tab=t.0#heading=h.phzdkkrsm7mt",
          "Scalable WebSockets (Google Doc)"
        ),
        v("https://www.youtube.com/watch?v=ORupgrqr3R0", "", "Scale WebSockets"),
        v("https://www.youtube.com/watch?v=IJkYipYNEtI", "Complete Redis, WebSockets, pub/sub and message queues bootcamp"),
        l("https://socket.io/docs/v4/", "Socket.io docs v4"),
        l("https://socket.io/docs/v4/tutorial/step-3", "Socket.io tutorial, step 3"),
        l("https://socket.io/docs/v4/emit-cheatsheet/", "Socket.io emit cheatsheet"),
      ],
    },
    {
      title: "4. Build plan",
      summary: "Courses and repos to build realtime projects.",
      items: [
        v("https://www.youtube.com/watch?v=UUddpbgPEJM", "", "Socket.io"),
        v("https://www.youtube.com/watch?v=CQQc8QyIGl0", "", "Socket.io project"),
        v("https://www.youtube.com/watch?v=pbOXOY78dNA", "", "Raw WebSocket, to continue for the project"),
        v("https://www.youtube.com/watch?v=Xn_j5sE6M_k", "Build a realtime group chat app using React.js and Socket.IO"),
        v("https://www.youtube.com/watch?v=tTCam8KGVRE", "Make a MERN stack chat app"),
        v("https://www.youtube.com/watch?v=aamk2isgLRk", "", "Metaverse game"),
        l(
          "https://github.com/KishanVyas308/Real-Time-Collaborative-Code-Editor/tree/main/apps",
          "Real-time collaborative code editor",
          "Real-time collaboration, like Google Drive."
        ),
        v("https://youtu.be/1SQo_LPeTiE", "", "WebRTC architecture and implementation with AI (Piyush Garg)"),
      ],
    },
    {
      title: "5. Project ideas",
      summary: "Things to build.",
      items: [
        t(
          "WebSocket todo board",
          "A todo app with WebSockets: one session with many users, and add, edit, delete and move tasks between columns."
        ),
        t("Coldplay booking system", "Coldplay ticket booking system."),
        t("Payment validation with webhooks", "Webhooks: backend to frontend payment validation."),
        l(
          "https://brindle-goal-102.notion.site/Backend-WebSocket-Live-Attendance-System-2c646b36b2e980b09b42d7c0240a8170",
          "Assignment (Cohort-3, 100xDevs): live attendance system",
          "Backend WebSocket live attendance system."
        ),
      ],
    },
  ],
};
