// Curated from data-system-design.md. Tracking query strings are stripped from every URL.
// Videos without a title get one from YouTube oEmbed when the seed script runs.

const v = (url, title = "", notes = "") => ({ type: "video", url, title, notes });
const l = (url, title = "", notes = "") => ({ type: "link", url, title, notes });
const t = (title, text) => ({ type: "text", title, text });

export const SYSTEM_DESIGN_STAGES = [
  {
    title: "1. Start here",
    summary: "Roadmaps, sources and repos to learn from.",
    color: "#6c8cff",
    items: [
      l("https://share.google/vbUZYOlAFmjosZ0FA", "System Design Roadmap"),
      l("https://drive.google.com/file/d/1XKoWwCvfThGLRWbTkjzLSqRmSXS2m8xC/view", "System Design Roadmap (Drive)"),
      l("https://share.google/gZE9XSoHPhnSevgvP", "How I Learned System Design (Himanshu Singour, Medium)"),
      l("https://share.google/xLBa4jZreUnI0UKb4", "Chai aur System Design (Eraser)"),
      l("https://hitesh.ai/system-design", "hitesh.ai system design"),
      l("https://app.eraser.io/workspace/kAxzxoI4w82jLuWjT0P0", "Eraser workspace"),
      l("https://paperdraw.dev", "paperdraw.dev"),
      t(
        "Where to learn",
        "0. Hello Interview (HLD)\n1. ByteByteGo\n2. freeCodeCamp\n3. CoderArmy (LLD)\n4. Hussain Nasser (LLD)\n5. Gaurav Sen (basics)\n6. Awesome System Design (GitHub repo)\n7. Designing Data-Intensive Applications (book)\n8. Whiteboard\n9. Marker"
      ),
      l("https://blog.bytebytego.com/", "ByteByteGo blog"),
      l("https://assets.bytebytego.com/ByteByteGo-Big-Archive-System-Design-2023.pdf", "ByteByteGo Big Archive 2023 (PDF)"),
      l("https://open.substack.com/pub/systemdesignone/p/system-design-fundamentals", "System design fundamentals (System Design One)"),
      l("https://substack.com/@systemdesignone/note/c-234591642", "System Design One note"),
      l("https://github.com/systemdesign42/system-design-academy", "system-design-academy"),
      l("https://github.com/liquidslr/system-design-notes", "liquidslr system-design-notes"),
      l("https://github.com/donnemartin/system-design-primer", "system-design-primer", "Link was cut off in the notes (system-design-p...)."),
      l("https://docs.google.com/document/d/1AvJfZF41k9ubRQzNw-yb93F_Q3Z-FjIordN0nSXD4QU/edit?tab=t.0", "System Design notes (Google Doc)"),
      l("https://www.linkedin.com/posts/dishajindgar_notes-ugcPost-7450154889336344576-fL8a", "System design notes (Disha Jindgar, LinkedIn)"),
      l("https://resources.criodo.com/?tab=resources", "Resources", "Kept exactly as written in the notes."),
      v("https://youtube.com/shorts/v1J26fD-e5I"),
    ],
  },
  {
    title: "2. Mindset",
    summary: "How to think before drawing boxes.",
    color: "#ff6b81",
    items: [
      t(
        "Do not prematurely optimise",
        "Understand the use case and the number of users, then design with that number in mind.\nKnow where you can avoid Kubernetes and a load balancer, and when you have to add them."
      ),
      t(
        "Distributed systems: why, when, how",
        "Focus less on what a system does and more on why, when and how. What is the easy part. Why it behaves the way it does is the hard part.\nThis is learnable: build intuition about trade-offs and spend hours on that one strange bug.\nExample: requests start timing out after a deploy, logs and dashboards look fine. If you only know what the system does, you are stuck. If you know why, you ask better questions: a hidden network hop? retries amplifying load? a config change causing a cascade?"
      ),
      v("https://youtube.com/shorts/BL7EClJVkEE", "Take notes"),
    ],
  },
  {
    title: "3. Core building blocks",
    summary: "Rate limiting, caching, queues, logging and friends.",
    color: "#ffb86b",
    items: [
      t("Topics checklist", "Queues, DLQs, Kafka, Redis, pub/sub, Docker, Kubernetes, containers, load balancer, rate limiting, throttling, circuit breakers, retries, idempotency, cron jobs."),
      v("https://youtu.be/uq-JpclPQV4", "20 system design concepts"),
      t(
        "Rate limiter",
        "Users can send many requests. To prevent abuse such as DDoS we use a rate limiter.\nUsed in the load balancer.\nAlgorithms: Leaky Bucket, Token Bucket."
      ),
      l("https://www.eraser.io/decision-node/api-rate-limiting-strategies-token-bucket-vs-leaky-bucket", "API rate limiting: token bucket vs leaky bucket"),
      t(
        "Redis: what it is for",
        "Reduce read pressure on the database.\nLarge temporary data that expires (TTL).\nShared counters, for example rate limiting a user whose requests hit different servers.\nBackground jobs: email, notifications, report generation."
      ),
      l("https://www.linkedin.com/posts/arslanahmad_ill-use-redis-in-a-system-design-interview-share-7508532112325722114-nlzw", "Redis and its different usage styles"),
      v("https://youtube.com/shorts/PEiNynjZoeM"),
      t(
        "Caching at scale",
        "Caching is not only about speed, and \"just put Redis in front of the database\" is not enough at real scale.\nMyntra moved inventory reads next to the application (near-cache). Zerodha kept the hot read path simple with Redis and HTTP ETags. Flipkart uses Aerospike as a real-time data layer for sale traffic.\nThere is no universal caching architecture. The right design depends on what breaks first."
      ),
      l("https://lnkd.in/gUN7Gkfi", "Blog: how Indian tech companies think about caching", "Short link was written as Inkd.in in the notes."),
      l("https://lnkd.in/gu4j2gaf", "Go demo: Myntra-style inventory cache", "Short link was written as Inkd.in in the notes."),
      v("https://youtube.com/shorts/CTCwLY-OqeA", "Caching"),
      l("https://lnkd.in/p/dc3v49yq"),
      v("https://youtu.be/uvgb6O6SRcE", "Queue"),
      v("https://youtu.be/q-2eqgB9M8I", "Queue"),
      v("https://www.youtube.com/watch?v=2tCfITBVKjA", "Master Queues | System Design Interview"),
      v("https://www.youtube.com/watch?v=o_ldk1_jzqQ", "Acks in System Design"),
      v("https://youtube.com/shorts/cPrEzLc2dDc", "Acks in System Design"),
      v("https://www.youtube.com/watch?v=yykV8qEwKXI", "Batching, Fan Out and scheduling in System Design"),
      t("Bloom filter", "Probabilistic set membership: no false negatives, some false positives, very small memory."),
      v("https://youtube.com/shorts/5wiJvT7EY3o", "Bloom filter"),
      v("https://youtube.com/shorts/9qkafcFWoFc", "Bloom filter"),
      l("https://x.com/i/status/2058170793046290924", "Bloom filter (X post)"),
      t("CDC and transaction outbox", "CDC (change data capture) in system design.\nTransaction outbox pattern."),
      l("https://www.linkedin.com/posts/anmol-a-674a21166_kafka-outbox-share-7514692226204053504-jC6f", "Kafka outbox (LinkedIn)"),
      v("https://youtube.com/shorts/vdx4-z5CoBk", "Webhooks"),
      v("https://www.youtube.com/watch?v=LIgKa1X7FbE", "Microservices", "To add in the system design Eraser workspace."),
      v("https://www.youtube.com/watch?v=q2phcnesXvY", "Zero Trust Architecture"),
      v("https://youtu.be/sDlCSIDwpDs", "Client side and peer to peer architecture"),
      v("https://youtube.com/shorts/pR0vcoh-bbY", "Log pipeline"),
      v("https://youtube.com/shorts/Vj16zyTYBjc", "Centralised logging"),
    ],
  },
  {
    title: "4. Authentication",
    summary: "Concepts, own auth system, 2FA.",
    color: "#f1fa8c",
    items: [
      v("https://youtu.be/iX8g4LqF8p8", "Authentication concepts"),
      v("https://www.youtube.com/watch?v=_lTECv25N2U", "Authentication concepts"),
      l("https://docs.google.com/document/d/1T9rxVbzQf4UtzUJbyvYQEn8LgsUBNn0m8y3-azrK6oY/edit?tab=t.0", "Authentication notes", "Needs improvements."),
      t(
        "How a server verifies an OTP without storing it (TOTP)",
        "When you set up 2FA, your device and the server share a secret key.\nEvery time you open the authenticator app it makes a code from that secret key and the current time.\nThe server runs the same calculation. If both match, you are in.\nNo database lookup, no stored OTPs, just math on both sides.\nTOTP (Time-based One-Time Password) powers most 2FA apps. Codes expire automatically, nothing sensitive is stored per login, and a captured code becomes useless quickly."
      ),
      v("https://youtu.be/hnfzT6d7mbo", "Own auth system"),
      v("https://youtube.com/watch?v=641_goNZGog", "Own auth system"),
      v("https://youtube.com/watch?v=E5zXCY63WpU", "Own auth system"),
      l("https://x.com/i/status/2052786883965710490", "Own auth system (X post)"),
    ],
  },
  {
    title: "5. Classic designs",
    summary: "The systems interviewers ask for.",
    color: "#50fa7b",
    items: [
      t(
        "Designs to cover",
        "URL shortener\nShort video sharing like Instagram Reels\nUber or another ride sharing app\nE-commerce website\nThe actual YouTube architecture\nLinkedIn or Twitter feed"
      ),
      v("https://youtu.be/8waadkDJwrs", "System Design of TinyURL"),
      v("https://www.youtube.com/watch?v=6TOOz6SSG0A", "Instagram architecture in 5 hours"),
      v("https://www.youtube.com/watch?v=FEkXjNFrL1o", "Twitter timeline architecture | Fanout | System Design"),
      v("https://www.youtube.com/watch?v=kkRJMgNgtKY", "Dropbox system design"),
      v("https://www.youtube.com/watch?v=jLM1nGgsT-I", "Design Google Drive or Dropbox (cloud file sharing service)"),
      v("https://youtube.com/shorts/1nc-vLzRfaM", "How a concert booking system works"),
      v("https://youtu.be/_l5Q5kKHtR8", "How big tech checks usernames"),
      v("https://youtube.com/shorts/rJA3UijAzTg", "Netflix"),
      v("https://www.youtube.com/watch?v=hOzH7ecc8vg", "Logger"),
    ],
  },
  {
    title: "6. Deep dives and internals",
    summary: "How the tools work, and how real systems failed.",
    color: "#8be9fd",
    items: [
      v("https://www.youtube.com/watch?v=iG5MiPFdk-o", "Internals of Postgres, Redis, Kafka", "One shot."),
      l("https://gist.github.com/piyushgarg-dev/32cadf6420c452b66a9a6d977ade0b01", "Kafka source code"),
      v("https://youtu.be/XjHZCprrEgk", "Database trade-offs of Netflix, Twitter and Instagram"),
      v("https://www.youtube.com/watch?v=xa-hMF8gku0", "Deep dive into Atlassian's mega outage of April 2022", "Arpit Bhayani."),
      v("https://www.youtube.com/watch?v=vgkBRj5wPXY", "The most complicated feature GeeksForGeeks ever built"),
      v("https://www.youtube.com/watch?v=WhIN4umuWpg", "Kafka vs Inngest"),
      v("https://www.youtube.com/watch?v=GeXJ0GxzVZM", "Low level design and data schema modeling of API clients like Requestly", "Arpit Bhayani."),
      v("https://youtube.com/shorts/XatinqzWCvo", "Git bad commit"),
      v("https://youtube.com/shorts/Qxwvw1MD1AM", "Linux zombie worker"),
    ],
  },
  {
    title: "7. AI system design",
    summary: "LLM cost, RAG and designing AI systems.",
    color: "#bd93f9",
    items: [
      t(
        "System design round at Anthropic",
        "You run an LLM in production at $0.40 per query. At 100,000 queries a day that is $40,000 a day.\nYour logs show 60,000 of those queries are slight variations of the same 200 questions, and the model writes a fresh answer every time.\nHow do you cut inference cost by 60% without the user ever feeling they got a cached or stale response?"
      ),
      v("https://youtu.be/UWNDvomXKEg"),
      v("https://youtu.be/NQZqET-jjws", "RAG"),
      v("https://www.youtube.com/watch?v=UqnLqEcTm5s", "AI system design"),
      l("https://www.linkedin.com/posts/nikhil-pandey-849814179_sde2-softwareengineering-dsa-share-7513686255931502592-gCM9", "AI system design (Nikhil Pandey, LinkedIn)"),
      v("https://youtu.be/D6QlZuz67LA", "AI system design from first principles"),
      v("https://youtube.com/shorts/diqAgn-kEYc"),
    ],
  },
  {
    title: "8. Interview prep",
    summary: "Interview-style videos, repos and tips.",
    color: "#ffffff",
    items: [
      t(
        "4 GitHub repos for 4 interview types",
        "1. System design interviews: github.com/ashishps1/awes...\n2. Low level design interviews: github.com/ashishps1/awes...\n3. Coding interviews: github.com/ashishps1/awes...\n4. Behavioral interviews: github.com/ashishps1/awes...\n(Links were cut off in the notes.)"
      ),
      v("https://youtu.be/adOkTjIIDnk", "System design one shot (Hayk Simoyan)"),
      v("https://www.youtube.com/watch?v=l3X1t3kpmwY", "How I mastered system design interviews"),
      v("https://www.youtube.com/watch?v=wwaadPgjYXY", "Tea and revision from Manware"),
      v("https://youtu.be/xMNSTBGoGbU"),
      v("https://youtube.com/shorts/0JSg44zuUTw"),
      v("https://youtube.com/shorts/0q4DkeF5RlQ"),
      v("https://youtube.com/shorts/RxhkKJ7jw6M", "System design interview"),
      v("https://youtube.com/shorts/5BdYIKUEUWY", "System design interview"),
      v("https://youtube.com/shorts/saRl3loqcdI", "System design interview"),
      v("https://youtube.com/shorts/QMPCogrLTeA"),
      v("https://youtube.com/shorts/LlMqHB_EHmE"),
      v("https://youtube.com/shorts/OURqXCbcTJM"),
      v("https://youtube.com/shorts/97jfDIOsejI"),
      v("https://youtube.com/shorts/K10f6UGTfH4"),
      v("https://youtube.com/shorts/4jDOEcN0knk"),
      l("https://www.linkedin.com/posts/akashkes22_if-you-want-to-become-a-better-backend-engineer-share-7455101439770775553-9V0I", "Become a better backend engineer (LinkedIn)"),
      l("https://www.linkedin.com/posts/system-design-ugcPost-7501988399663300608-P6qg", "System design post (LinkedIn)"),
      l("https://www.linkedin.com/posts/sameer-bhardwaj1298_if-you-want-to-become-s-tier-at-system-design-share-7505240868782522368-EpXb", "S-tier at system design (LinkedIn)"),
      l("https://www.linkedin.com/posts/thecreatorsir_dsa-gets-you-shortlisted-but-its-system-share-7505493225806344195-MWev", "DSA gets you shortlisted, system design gets you hired (LinkedIn)"),
      l("https://lnkd.in/p/dNKFRQR5"),
      l("https://www.linkedin.com/posts/thriverashish_backend-systemdesign-softwareengineering-share-7511042617707659266-_fqz", "Backend and system design (LinkedIn)"),
      l("https://www.linkedin.com/posts/mohdfaizan12_systemdesign-backenddevelopment-softwareengineering-share-7510662196532498433-Yus0", "System design and backend (LinkedIn)"),
    ],
  },
];
