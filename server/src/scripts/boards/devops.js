import { l, t, v } from "./helpers.js";

// From the "Devops" chat.
export default {
  slug: "devops",
  name: "DevOps",
  stages: [
    {
      title: "1. Start here",
      summary: "A beginner-friendly bootcamp and free resources.",
      items: [
        v(
          "https://www.youtube.com/watch?v=sSRaakd95Nk",
          "Complete DevOps bootcamp (beginner friendly): EC2 servers, S3, CDNs, nginx and VMs (cohort preview)"
        ),
        l("https://itkfunde.graphy.com/products", "Free DevOps resources"),
      ],
    },
    {
      title: "2. AWS",
      summary: "Accounts, services, S3 CORS and a first deployment.",
      items: [
        l("https://docs.google.com/document/d/1KYL7XxjlT6mw4W_mIio-b5jCIkInDUZmHoeQD4h2uhg/edit?usp=drivesdk", "AWS notes (Google Doc)"),
        l("https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html", "AWS: S3 CORS"),
        l("https://share.google/uzUE40cuijnQbumlb", "AWS Builder Center"),
        l(
          "https://builder.aws.com/content/2zYRIN2NxZTNLhwP9ZyaiJBEWrI/aws-tools-and-resources-javascript",
          "AWS tools and resources for JavaScript"
        ),
        l("https://learn.nextwork.org/projects/aws-account-setup", "AWS account setup (NextWork)"),
        v("https://www.youtube.com/watch?v=Uf6PXnagtsg", "Complete Docker + AWS | Deploy your first project in one shot (beginners)"),
      ],
    },
    {
      title: "3. Docker",
      summary: "What to watch first.",
      items: [
        v("https://youtube.com/watch?v=07S2VQXlaN4", "", "Priority 1"),
        v("https://youtube.com/watch?v=ObhdD49AEYw", "Docker (priority 2, no need)"),
      ],
    },
    {
      title: "4. Kubernetes and serverless",
      summary: "Orchestration and the Serverless Framework.",
      items: [
        v("https://youtube.com/shorts/OdPriWKCH6I", "Kubernetes"),
        v("https://www.youtube.com/watch?v=bpPP8vZua-w", "Master the Serverless Framework"),
      ],
    },
    {
      title: "5. Deployment and Linux",
      summary: "What is in a deployment, and projects for Linux basics.",
      items: [
        v("https://youtube.com/shorts/ilK7UP8piFc", "What's in deployment"),
        v("https://youtube.com/shorts/UadmRMr1JfQ", "Projects for the basics of Linux, system or kernel"),
      ],
    },
    {
      title: "6. Resume projects",
      summary: "Projects that help for cloud and DevOps jobs.",
      items: [
        v("https://www.youtube.com/watch?v=X6Kw2_wZr1E", "5 resume projects for cloud and DevOps jobs"),
        v("https://www.youtube.com/watch?v=4W0pBmeTGRU", "These AWS projects give you an unfair advantage"),
        l("https://www.skool.com/cloudengineeracademy-mini/about", "Cloud Engineer Academy (Skool)"),
      ],
    },
    {
      title: "7. Tools",
      summary: "Small tools that came up.",
      items: [
        l("https://github.com/TomasTomecek/sen", "sen (terminal UI for Docker)"),
        l("http://pikwy.com/", "pikwy: screenshot of a web page"),
        t("Ping test tool", "pingtesttool: ping from another IP address."),
      ],
    },
    {
      title: "8. Videos and shorts",
      summary: "Saved without a label.",
      items: [
        v("https://youtu.be/6t2NhkRsmuA"),
        v("https://youtu.be/yHAQmRrP25A"),
        v("https://youtu.be/NnkUGzaqqOc"),
        v("https://youtube.com/shorts/_vpUF-xogYM"),
        v("https://youtube.com/shorts/4um87lAo0yA"),
        v("https://youtube.com/shorts/IH1ummB8Q-c"),
        v("https://youtube.com/shorts/5M1JOpEGuko"),
        v("https://youtube.com/shorts/eMqqYEfWALo"),
        v("https://www.youtube.com/shorts/zQSx8JyECbc"),
        v("https://youtu.be/tJaUAeaTtFk"),
        l("https://x.com/i/status/2025858542893257104", "X post"),
      ],
    },
  ],
};
