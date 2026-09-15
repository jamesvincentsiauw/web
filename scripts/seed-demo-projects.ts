import 'dotenv/config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../src/payload.config'

const database = new URL(process.env.DATABASE_URL || '')
if (!['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) {
  throw new Error('Demo seeding is restricted to the local database.')
}

const richText = (text: string) => ({
  root: {
    type: 'root', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const,
    children: [{
      type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
      children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    }],
  },
})

const demos = [
  {
    slug: 'demo-ai-workflow-studio', title: 'AI Workflow Studio', category: 'ai-workflows' as const,
    summary: 'Demo case study: a visual workspace for composing agent tasks, validating dependencies, and reviewing each run.',
    role: 'Example role: Full-stack engineer', skills: ['Next.js', 'ReactFlow', 'Python', 'FastAPI'],
    context: 'Demo scenario, not a shipped client project. An operations team needs to turn repeated research tasks into reusable workflows while keeping human review before the final output.',
    contribution: 'Example scope: design the workflow editor, model node inputs and outputs, validate dependencies, and connect the editor to a run-history view. Replace this paragraph with your actual contribution.',
    decisions: 'Example tradeoff: represent dependencies as a directed acyclic graph so execution order is explicit. Validate before running and retain per-node results for debugging. This adds schema and versioning work compared with a single prompt.',
    outcome: 'Illustrative outcome: users can describe a workflow, inspect a failed step, and review an output before release. No production results or performance measurements are claimed. Replace this with your evidence.',
    bg: '#e7eee5', ink: '#2b4d39', labels: ['Input', 'Agent task', 'Human review', 'Export'],
  },
  {
    slug: 'demo-commerce-data-pipeline', title: 'Commerce Data Pipeline', category: 'data-infrastructure' as const,
    summary: 'Demo case study: a collection pipeline that turns inconsistent source records into validated, normalized data.',
    role: 'Example role: Backend engineer', skills: ['Python', 'Django', 'Celery', 'Docker'],
    context: 'Demo scenario, not a company architecture. Multiple sources use different formats and fail independently. The proposed pipeline separates collection, validation, and delivery so a failed source can be retried independently.',
    contribution: 'Example scope: implement collection jobs, queue retries, record normalization, duplicate detection, and a review queue for invalid records. Edit the scope to reflect what you actually built.',
    decisions: 'Example tradeoff: asynchronous jobs isolate source failures, but require idempotency and operational visibility. Invalid records are quarantined instead of silently dropped, adding review work in exchange for traceability.',
    outcome: 'Illustrative outcome: a consistent record format and a visible path for failed records to be reviewed and retried. Throughput, accuracy, and savings are intentionally not asserted in this demo.',
    bg: '#e9e9e2', ink: '#454c37', labels: ['Sources', 'Collect', 'Validate', 'Normalize'],
  },
  {
    slug: 'demo-seller-event-insights', title: 'Seller Event Insights', category: 'product-engineering' as const,
    summary: 'Demo case study: an event-driven view of seller activity, with a clear distinction between fresh and delayed data.',
    role: 'Example role: Software engineer', skills: ['Go', 'Apache Kafka', 'Redis'],
    context: 'Demo scenario, not a production dashboard. A seller needs to understand incoming activity without repeatedly refreshing reports. Event arrival can be delayed, so the interface must make data freshness explicit.',
    contribution: 'Example scope: define event contracts, consume events, build read models, and expose freshness information to the interface. Replace this with your actual responsibilities and team boundaries.',
    decisions: 'Example tradeoff: precomputed read models keep queries simple but introduce eventual consistency. Deduplication and a last-updated indicator make the behavior understandable when events arrive late.',
    outcome: 'Illustrative outcome: sellers can inspect activity and distinguish delayed updates from a true absence of events. This demo contains no measured business impact or invented traffic figures.',
    bg: '#e7ebef', ink: '#354957', labels: ['Events', 'Stream', 'Read model', 'Insights'],
  },
]

function diagram(demo: typeof demos[number], index: number) {
  const nodes = demo.labels.map((label, i) => {
    const x = 70 + i * 290
    const y = index === 0 && i % 2 ? 310 : 230
    return `<rect x="${x}" y="${y}" width="190" height="110" rx="12" fill="#ffffff" stroke="${demo.ink}" stroke-width="2"/><text x="${x + 95}" y="${y + 64}" text-anchor="middle" font-size="24" fill="${demo.ink}">${label}</text>`
  }).join('')
  const edges = [0, 1, 2].map(i => {
    const x = 260 + i * 290
    const y1 = index === 0 && i % 2 ? 365 : 285
    const y2 = index === 0 && (i + 1) % 2 ? 365 : 285
    return `<path d="M${x} ${y1} C${x + 50} ${y1},${x + 50} ${y2},${x + 100} ${y2}" stroke="${demo.ink}" stroke-width="2" fill="none" marker-end="url(#arrow)"/>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8" fill="none" stroke="${demo.ink}"/></marker></defs>
    <rect width="1200" height="750" fill="${demo.bg}"/>
    <g font-family="Helvetica, Arial, sans-serif"><text x="70" y="92" font-size="20" fill="${demo.ink}">CONCEPT STUDY / 0${index + 1}</text>
    <text x="70" y="153" font-size="42" fill="${demo.ink}">${demo.title}</text>
    ${edges}${nodes}
    <path d="M165 470 V505 H1035 V470" stroke="${demo.ink}" stroke-width="1.5" fill="none" stroke-dasharray="6 7"/>
    <text x="600" y="555" text-anchor="middle" font-size="22" fill="${demo.ink}">${index === 0 ? 'Validate dependencies before execution' : index === 1 ? 'Review failures and retry safely' : 'Track freshness across the event path'}</text>
    <path d="M70 635 H1130" stroke="${demo.ink}" opacity=".3"/>
    <text x="70" y="687" font-size="21" fill="${demo.ink}">DEMO CONTENT</text><text x="1130" y="687" text-anchor="end" font-size="21" fill="${demo.ink}">Illustrative diagram, not production architecture</text></g>
  </svg>`
}

const payload = await getPayload({ config })
try {
  for (const [index, demo] of demos.entries()) {
    const existing = await payload.find({ collection: 'projects', where: { slug: { equals: demo.slug } }, depth: 0, limit: 1, overrideAccess: true })
    if (existing.docs.length) { console.log(`Skipped existing ${demo.slug}`); continue }
    const skillDocs = await payload.find({ collection: 'skills', where: { and: [{ name: { in: demo.skills } }, { _status: { equals: 'published' } }] }, pagination: false, overrideAccess: true })
    const filename = `${demo.slug}.png`
    const existingMedia = await payload.find({ collection: 'media', where: { downloadName: { equals: filename } }, limit: 1, overrideAccess: true })
    let media = existingMedia.docs[0]
    if (!media) {
      const data = await sharp(Buffer.from(diagram(demo, index))).png().toBuffer()
      media = await payload.create({
        collection: 'media', overrideAccess: true,
        data: { alt: `Demo concept: ${demo.labels.join(' to ')}. Not a production architecture.`, caption: 'Demo concept diagram. Replace with your own project image.', downloadName: filename, visibility: 'public', contentReady: true },
        file: { data, mimetype: 'image/png', name: filename, size: data.length },
      })
    }
    const featured = await payload.count({ collection: 'projects', where: { and: [{ featured: { equals: true } }, { _status: { equals: 'published' } }] }, overrideAccess: true })
    const project = await payload.create({
      collection: 'projects', overrideAccess: true, draft: false,
      data: {
        title: demo.title, slug: demo.slug, summary: demo.summary, category: demo.category,
        projectType: 'personal', organization: 'Demo / editable example', role: demo.role,
        context: richText(demo.context), contribution: richText(demo.contribution), decisions: richText(demo.decisions), outcome: richText(demo.outcome),
        technologies: skillDocs.docs.map(skill => skill.id), cover: media.id,
        sortOrder: 100 + index * 10, featured: featured.totalDocs < 3,
        _status: 'published', contentReady: true,
        internalSource: 'User-authorized dummy content for local portfolio design review, September 2026.',
        internalNotes: 'Editable demo, not a claim of completed client work. Replace title, summary, organization, role, narrative and cover; remove demo labels only after adding real content. Original CV drafts were not modified.',
      },
    })
    console.log(`Created published demo: ${project.slug} (id ${project.id}, cover ${media.id})`)
  }
} finally {
  await payload.destroy()
}
