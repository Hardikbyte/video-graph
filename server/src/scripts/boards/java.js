import { l, t, v } from "./helpers.js";

// From the "JAVA" chat. The email address in the original chat is left out on purpose.
export default {
  slug: "java",
  name: "Java",
  stages: [
    {
      title: "1. Spring Boot path",
      summary: "Courses and sources for learning Spring Boot.",
      items: [
        t("Devtiro", "Ultimate guide to Spring Boot (Devtiro, YouTube)."),
        t("Programming with Mosh", "Spring Boot course by Programming with Mosh."),
        t("Docs plus ChatGPT", "Learn from the Spring Boot docs together with ChatGPT."),
        t("Amigoscode", "Spring Boot playlist by Amigoscode.\nSpring Boot, ReactJS and AWS by Amigoscode."),
        t("Project-based learning", "Project-based learning from GitHub."),
      ],
    },
    {
      title: "2. Java basics",
      summary: "The language itself.",
      items: [
        l("https://www.youtube.com/playlist?list=PLQEaRBV9gAFsR15tNo2QLF9d2qc-c018p", "Java full course (playlist)"),
        t("Java for programmers (Mosh)", "Java for programming with Mosh."),
        t("W3Schools", "W3 School."),
        t("Java Revisited newsletter", "The Java Revisited newsletter arrives by email."),
      ],
    },
    {
      title: "3. Videos and links",
      summary: "Saved without a label.",
      items: [
        v("https://www.youtube.com/watch?v=4XTsAAHW_Tc"),
        v("https://www.youtube.com/watch?v=fmX84zu-5gs"),
        v("https://youtu.be/S3m9ciFrOKQ"),
        l("https://topmate.io/interviewswithsumit/1199866", "Interviews with Sumit (Topmate)"),
      ],
    },
  ],
};
