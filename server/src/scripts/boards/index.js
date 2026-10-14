import { SYSTEM_DESIGN_STAGES } from "../systemDesignData.js";
import aiTools from "./aiTools.js";
import dsa from "./dsa.js";
import devops from "./devops.js";
import interview from "./interview.js";
import java from "./java.js";
import jobs from "./jobs.js";
import vibeCoding from "./vibeCoding.js";
import webTerminologies from "./webTerminologies.js";
import website from "./website.js";

// Every board the seed script knows about. Pick some with --only=slug,slug.
export const BOARDS = [
  { slug: "system-design", name: "System Design", stages: SYSTEM_DESIGN_STAGES },
  aiTools,
  dsa,
  devops,
  interview,
  java,
  jobs,
  vibeCoding,
  webTerminologies,
  website,
];
