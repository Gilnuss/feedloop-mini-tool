/**
 * The three sample datasets offered on the input screen.
 *
 * Real reviews of real products, cited with source and date — that provenance is
 * the point. A visitor who suspects the samples were written to flatter the
 * clustering learns nothing from watching it work, so the label under each
 * dataset name is doing as much work as the items themselves.
 *
 * 30 items each, deliberately: enough that the 30 → 7 collapse is striking, few
 * enough to stay inside the 100-item cap and one decode's cost.
 *
 * Extracted from components/FeedbackInput.tsx during the restyle — it was 287
 * lines, almost all of it this array.
 */

export interface SampleDataset {
  id: string;
  product: string;
  source: string;
  date: string;
  count: number;
  items: string[];
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: "notion",
    product: "Notion",
    source: "Trustpilot + Product Hunt + GitHub Issues",
    date: "2025-2026",
    count: 30,
    items: [
      "Notion is really complicated and slow nowadays. It lost the charm now.",
      "i loved notion before, but sadly it has changed... it's often buggy and slow now, which make managing tasks frustrating",
      "It can be really useful when it works properly, but the problem is its often slow or goes down, which makes it frustrating to rely on.",
      "The pro upgrade is a scam. AI agent features require additional charges beyond the subscription costs you already pay.",
      "Predatory billing practices. I shared read-only content and it resulted in unexpected billable member charges I never authorized.",
      "I paid $288 for an annual Business plan and they refused to refund me after I barely used it. Rigid refund policy is unacceptable.",
      "they changed the api integration so that it's unpossible now",
      "worst software ever its always buggy",
      "the worst app cant even load first of all",
      "Way too expensive",
      "To close your account you need to provide your email that you sign into with, yet it doesn't recognise it at all. No customer support either.",
      "Great tool if someone explains how to use it and builds everything for you. Otherwise - waste of time. No support.",
      "Cannot change seats so they let you pay unnecessary much.",
      "Notion has given me the flexibility I was looking for in my projects. I have everything I need in one place.",
      "Notion has been a really good tool for the team communication, task management or collaborative projects.",
      "Notion's core problem is that it creates work disguised as productivity. A plain text file and Google Docs get more done in less time.",
      "Credit where it's due, the customisation options are extensive. You can build almost anything.",
      "There is no API endpoint to enable or configure subitems on a database programmatically. Teams automating project hierarchies are blocked.",
      "When retrieving data from datasource query, the type of item which has rich text or title property is incorrect.",
      "Callout blocks are defined under BlockObjectRequestWithoutChildren type, while in reality they do have children. This inaccuracy is also present in the docs.",
      "Notion is a slow app that sometimes takes forever to load. Since it operates primarily online, the application must download notes each time it opens.",
      "I cannot take a note offline when lacking WiFi or in areas with poor cellular reception. This is a dealbreaker for me.",
      "Just spent 45 mins trying to copy and paste something from one page to another lol started glitching out and being slow af.",
      "Pasting text from other places often messes up the formatting.",
      "The API's rate limit is 3 requests per second per integration. Some actions require multiple API calls which consumes your task limits quickly.",
      "Although offline mode shipped after years as the most requested feature, it comes with real limitations: sync conflicts can silently overwrite work.",
      "No built-in way to pop information up where you actually need it. Missing features like time tracking and native reporting/charts.",
      "AI features feel basic compared to competitors. Limited native form capabilities without conditional logic.",
      "Performance drops noticeably with databases over 5,000 records. Loading times increase from instant to 3-5 seconds per page.",
      "The mobile version is limited compared to desktop. I have difficulties editing pages and navigating the app on smaller screens.",
    ],
  },
  {
    id: "linear",
    product: "Linear",
    source: "Product Hunt + GitHub Issues + Trustpilot",
    date: "2025-2026",
    count: 30,
    items: [
      "Linear brags about 'god-tier design,' but they literally trap your data. I deleted my workspace and now I'm stuck in a permanent redirect loop.",
      "Definitely a great fit for small teams. We love the super clean/intuitive interface, awesome keyboard shortcuts. The one thing frustrating is how often bugs creep into new releases.",
      "Very poor customer relations and a waste of time. Why advertise a product when you don't reply to joining requests? No contact for 2 months now.",
      "3x better than Jira. So glad we found this tool. Never going back to Jira.",
      "No one on our team liked project management software until we found Linear.",
      "After years of Jira, we really loved the speed that Linear allowed us to reach!",
      "Linear is the only PM tool that doesn't feel like it's fighting you. We track everything across engineering in it.",
      "If you are a product based company, Linear is the most powerful fine-tuned platform. But if you are a software service company, it is hard to manage multiple client projects.",
      "Linear is missing documentation features like Jira Confluence. Hard to manage multiple projects being released simultaneously.",
      "Started using linear recently, really flexible software. Lack of sharing capabilities externally is quite a problem.",
      "The sidebar has many tabs together, making it annoying to navigate. They should try making the letters bigger.",
      "Linear fits well for small startup teams but gets messy when the roadmap grows just a little. There are no board or flight level views.",
      "The main criticism: it can feel opinionated and limiting for larger, client-facing, or multi-team workflows.",
      "MCP cannot be authenticated in claude code. It opens the browser, shows 'Login successful' but never comes back to the application.",
      "Error: setTeams cannot be combined with addTeams or removeTeams. I keep getting this error when the MCP tries to call linear_save_project.",
      "When syncing large numbers of issues from external tools, the only option is to call save_issue one at a time. For 78 issues, this means 78 sequential API calls.",
      "The MCP server exposes approximately 45 tools. Some agents warn when tools exceed 50. Please redesign the MCP tools around user tasks, not API endpoints.",
      "The 'Remind Me' feature exists only in the UI but there are no corresponding GraphQL mutations for programmatic access.",
      "CSV imports ignore dependencies, requiring manual linking afterward. Please support setting issue dependencies in linear-import.",
      "Your new Pull Request Reviews feature on GitHub is fire. We use a self-hosted GitLab instance and would love the same for GitLab merge requests.",
      "How can we keep the creator data from the CSV? After import, I get all issues created by the user that created the API key.",
      "Sometimes I want all issues under a project to have certain labels. Having to add the label to each issue is unnecessarily time consuming.",
      "Speed compared to Jira, keyboard support, dark mode, simplicity focus, integrations. The one thing missing is more analytics on the standard plan.",
      "Simplicity, stunning design, product integrations. It lacks a simple time tracking tool and there's no integration with the Tempo app.",
      "Github integration allows commit referencing which is great for team coordination. But there's dead space in the UI and the inbox functionality is unclear.",
      "Simple, straightforward UI, great tagging/labeling. The main gap: no mobile apps and it lacks documentation software like Confluence.",
      "Accessibility through keyboard shortcuts and Slack integration makes the entire work process much simpler. This is the only PM tool I actually want to open.",
      "Bugs creep into new releases frequently. We've had bugs that partially or fully disrupted the ability to use their web app three times in the last two months.",
      "We use Linear to manage the roadmap, dev and design tasks and support cases. The one real gap is there's no first-class release management view.",
      "Onboarding is smooth once you're in, but the curve for users migrating from other tools is real. Everything works differently enough from Jira.",
    ],
  },
  {
    id: "affine",
    product: "AFFiNE",
    source: "GitHub Issues",
    date: "2025-2026",
    count: 30,
    items: [
      "CAN'T PAY FOR LIFETIME PLAN. BRO I CAN'T PAY / SUBSCRIBE TO PAID LIFETIME MEMBERSHIP NEITHER THROUGH THE APP NEITHER THROUGH THE WEB VERSION MAN!",
      "Cant Sign-In to my Affine Cloud Account. I am trying to sign in via Google Auth but it is not working and I get error 400.",
      "AFFiNE Cloud attachments fail to upload/open, GraphQL returns 502 Bad Gateway.",
      "mac platform option+command+c can't make text to code block. Nothing happens.",
      "Shared Edgeless/Board pages render login page for unauthenticated visitors instead of the board content.",
      "please add export to pdf and word",
      "Pressing enter when editing column header name doesn't save the edits. The edit overlay closes without saving.",
      "Sidebar constantly reordering while typing. While typing in a document the documents in the sidebar keep moving.",
      "Kanban board is broken. After the last update all cards disappeared and the board shows empty.",
      "can't login in selfhosted Affine instance even after running the affine_migration_job with success.",
      "Search is broken in desktop apps for non-latin and non-CJK words. Affected languages are Russian, Ukrainian.",
      "Docker image runs as root. This is a security concern for self-hosted deployments.",
      "After selecting text to add a hyperlink, directly typing Chinese characters causes the program to freeze.",
      "would you kindly add a zoom in/out function, just like onenote or other office software.",
      "I find this software incredibly satisfying to use. It's exactly the kind of tool I've always dreamed of.",
      "Native table block column resize broken in edgeless mode. Dragging the column resize handle causes the entire canvas to pan.",
      "When writing in multi-select field the first letter creates new option instead of searching existing options.",
      "Arabic text with embedded English becomes unreadable in the app. The text alignment breaks.",
      "Arrows connecting two shapes are not duplicated when duplicating a page.",
      "Can't Connect to self hosted with Android App. Self hosted Affine Behind Traefik and netbird.",
      "Inherit tags from templates upon creation of document. I would like to add a tag like 'Meeting-Notes' to a template.",
      "Tag-based AI search for documents (MCP Server). I needed to search for documents marked with a specific tag but this feature doesn't exist.",
      "when i try to link google calendar, there's an error 'This app is blocked' by Google.",
      "Page Mode loading and editing lag scale with number of embedded frames. The more frames, the worse the lag.",
      "Documents created via MCP WebSocket API don't appear in workspace doc list despite being queryable via GraphQL.",
      "The drawing board connected arrow blocks the text. Arrows on the canvas overlap and cover text in notes.",
      "Hyperlinks are not clickable when textbox is locked on edgeless canvas.",
      "Basic editor bug: can't add image in quote.",
      "Keyboard shortcuts unable writing in Polish. Pressing Polish diacritic characters triggers shortcuts instead of typing.",
      "import markdown files did not download the images. If the markdown has embedded images from external URLs, they are not downloaded on import.",
    ],
  },
];
