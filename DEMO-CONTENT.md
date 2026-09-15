# Editing the portfolio demo

Three published examples were added to the local CMS without modifying the original CV project drafts:

| Project | CMS ID | Slug |
|---|---|---|
| AI Workflow Studio | 9 | demo-ai-workflow-studio |
| Commerce Data Pipeline | 10 | demo-commerce-data-pipeline |
| Seller Event Insights | 11 | demo-seller-event-insights |

Open `/admin`, then **Projects** and select a demo. Edit Overview (title, summary, category, organization, role), Case Study (context, contribution, decisions, outcome), and Media & Links (cover and technologies). Save draft to prepare edits; Publish to update the public page. Use Featured and Sort order to choose the homepage order.

The diagrams are stored in Media, IDs 1–3. Upload your own image and select it as the project cover; the homepage, work index and detail page use the CMS cover. Update alt text and caption too. No screenshots or outcome measurements are claimed to be real in these examples. Replace the example copy before removing its demo labels.

Homepage layout now uses a more compact hero, one prominent case study and two smaller companion entries. At narrow widths these stack in reading order. Projects without covers still render their text. Existing theme and background animation controls remain available.

The additive seed script is `scripts/seed-demo-projects.ts`. It only accepts a local database host and skips existing demo slugs, so re-running it does not overwrite your edits. Its use is optional; the three examples are already in the database. Do not use it to reset edited content.

Validation: TypeScript and targeted ESLint passed. Homepage and cover delivery were checked over HTTP. Final browser-based checks of mobile and both themes could not be completed because no browser connection was available in the resumed session.
