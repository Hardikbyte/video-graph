import { l, t, v } from "./helpers.js";

// From the "DSA" chat.
export default {
  slug: "dsa",
  name: "DSA",
  stages: [
    {
      title: "1. Roadmap",
      summary: "DSA from zero to placement ready, in order.",
      items: [
        l(
          "https://docs.google.com/document/d/1p9Rj2d8v4aGWc-UdLbWPwXGI6_cTLXKIFv_sWYwziHU/edit?tab=t.0",
          "DSA roadmap (Google Doc)"
        ),
        t(
          "Foundations",
          "Time and space complexity\nBig-O notation\nRecursion basics\nBasic math (GCD, prime, etc.)"
        ),
        t(
          "Core data structures",
          "Arrays and strings\nLinked list\nStack and queue\nHashing (map, set)\nSliding window and two pointers"
        ),
        t(
          "Intermediate algorithms",
          "Binary search\nSorting techniques\nPrefix sum\nRecursion and backtracking\nBit manipulation"
        ),
        t(
          "Advanced data structures",
          "Trees (binary tree, BST)\nHeaps and priority queue\nGraphs (BFS, DFS)\nTries\nDisjoint set (union-find)"
        ),
        t(
          "Advanced algorithms",
          "Dynamic programming\nGreedy algorithms\nGraph algorithms (Dijkstra, Floyd)\nTopological sort\nShortest path problems"
        ),
        t(
          "Practice and patterns",
          "LeetCode and Codeforces\nPattern recognition\nTimed practice\nMock interviews\nRevision strategy"
        ),
        t(
          "Placement preparation",
          "Company-wise questions\nSystem design basics\nCore CS (OS, DBMS, CN)\nBehavioral questions"
        ),
      ],
    },
    {
      title: "2. Resources",
      summary: "Practice sets, roadmaps, notes and playlists.",
      items: [
        l("https://neetcode.io/practice/practice/neetcode250", "NeetCode 250"),
        l("https://algomap.io/roadmap", "AlgoMap roadmap"),
        l("https://namastedev.com/roadmaps/dsa", "NamasteDev DSA roadmap"),
        l(
          "https://whimsical.com/dsa-4-placement-by-love-babbar-C7JX2fJ8hprv9ivEHkArjD",
          "DSA for placement (Love Babbar, Whimsical)"
        ),
        l("https://drive.google.com/file/d/1WPcFQs8pw8NvWSYKtvO8Ythj1cQgixfP/view", "Arrays notes"),
        l("https://www.freecodecamp.org/news/leetcode-dsa-concepts-handbook/", "LeetCode DSA concepts handbook (freeCodeCamp)"),
        l(
          "https://docs.google.com/document/d/1R0u2CjIZakA-FiY4cMuOyRvxpSLLEiQyyCcm-JHjzOw/edit?tab=t.0#heading=h.sbx2bxiofskr",
          "swerik notes"
        ),
        v("https://www.youtube.com/watch?v=0DJifcw2UGI&list=PLqM7alHXFySGwOTADxwHrgH8m_XpgrB-k&index=29", "", "DSA playlist"),
        v("https://youtube.com/watch?v=J2fol8eWo64", "", "DSA by Tech With Tim"),
      ],
    },
    {
      title: "3. Notes",
      summary: "Short notes written while learning.",
      items: [
        t(
          "Array vs HashMap",
          "Use an array when the range is fixed and small.\nUse a HashMap when the range is unknown or large."
        ),
        v("https://youtube.com/shorts/8XarftRMayM"),
        t(
          "Heap: insert, delete, heapify",
          "Insert: add at the bottom and move it up.\nDelete: take the last element, put it at the top and move it down.\nHeapify: start from the last (leaf) node, check that each parent is valid, and repeat this up to the root via the parents (recursively)."
        ),
        l(
          "https://leetcode.com/problems/majority-element/submissions/1980307500/",
          "Majority Element (my LeetCode submission)"
        ),
      ],
    },
    {
      title: "4. To do",
      summary: "Things to practise next.",
      items: [
        t("Practise CRUD", "CRUD operations of all: array, linked list, graph, tree."),
        t("LeetCode", "LEETCODE -> PROFILE"),
      ],
    },
    {
      title: "5. Interview experience",
      summary: "What a real round looked like.",
      items: [
        t(
          "First tech round: cache system",
          "The first tech round was more like a DSA round. I was asked to code a cache system optimally and was able to do it, but got stuck on an edge case at the end. The rest of the interview was smooth."
        ),
      ],
    },
    {
      title: "6. Shorts and posts",
      summary: "Quick videos and posts saved for later.",
      items: [
        v("https://youtube.com/shorts/5MoUm5x55rE"),
        l(
          "https://www.linkedin.com/posts/parikh-jain-79568798_trust-me-cracking-offers-is-not-hard-if-share-7504412395650441216-XOlX",
          "Cracking offers is not hard (Parikh Jain, LinkedIn)"
        ),
      ],
    },
  ],
};
