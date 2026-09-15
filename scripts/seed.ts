/**
 * Seeds CMS content from CV_VincentSiauw_August_26.pdf (PRD §4). CV statements are unverified
 * claims; everything is created as a draft for the owner to review.
 *
 * Projects are ALWAYS drafts. For local review only, non-project content can be published with:
 *   SEED_PUBLISH=profile,settings,experiences,skills,education pnpm seed
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const CV_SOURCE = 'CV_VincentSiauw_August_26.pdf (one page, August 2026). Unverified CV statements.'

const publishable = new Set(['profile', 'settings', 'experiences', 'skills', 'education'])
const requested = new Set((process.env.SEED_PUBLISH ?? '').split(',').map((part) => part.trim()).filter(Boolean))
for (const key of requested) {
  if (!publishable.has(key)) {
    console.error(`SEED_PUBLISH cannot include "${key}". Projects are always seeded as drafts.`)
    process.exit(1)
  }
}

/** Draft by default; published (with contentReady) only when explicitly requested for local review. */
const statusFor = (key: string) =>
  requested.has(key) ? { draft: false, data: { _status: 'published' as const, contentReady: true } } : { draft: true, data: { _status: 'draft' as const } }

// --- Lexical helpers ------------------------------------------------------

const textNode = (text: string) => ({ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 })
const base = { format: '', indent: 0, version: 1, direction: 'ltr' }
const paragraph = (text: string) => ({ ...base, type: 'paragraph', textFormat: 0, children: [textNode(text)] })
const bullets = (items: string[]) => ({
  ...base,
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  children: items.map((item, index) => ({ ...base, type: 'listitem', value: index + 1, children: [textNode(item)] })),
})
const doc = (...children: object[]) => ({ root: { ...base, type: 'root', children } })

// --- Content --------------------------------------------------------------

const SKILLS: Array<[string, string]> = [
  ['Go', 'languages-frameworks'],
  ['Python', 'languages-frameworks'],
  ['TypeScript', 'languages-frameworks'],
  ['JavaScript', 'languages-frameworks'],
  ['SQL', 'languages-frameworks'],
  ['React', 'languages-frameworks'],
  ['Next.js', 'languages-frameworks'],
  ['ReactFlow', 'languages-frameworks'],
  ['FastAPI', 'languages-frameworks'],
  ['Django', 'languages-frameworks'],
  ['OpenAI API', 'ai'],
  ['LLM Agent Design', 'ai'],
  ['Prompt Engineering', 'ai'],
  ['Microservices Architecture', 'backend'],
  ['RESTful APIs', 'backend'],
  ['gRPC', 'backend'],
  ['Webhook Systems', 'backend'],
  ['PostgreSQL', 'data'],
  ['NoSQL', 'data'],
  ['Redis', 'data'],
  ['RabbitMQ', 'messaging'],
  ['Apache Kafka', 'messaging'],
  ['Temporal', 'messaging'],
  ['Celery', 'messaging'],
  ['Google Cloud Platform (GCP)', 'infrastructure'],
  ['Docker', 'infrastructure'],
]

const payload = await getPayload({ config })

const existing = await Promise.all(
  (['projects', 'experiences', 'skills', 'education'] as const).map((collection) =>
    payload.count({ collection, overrideAccess: true }),
  ),
)
if (existing.some((result) => result.totalDocs > 0)) {
  console.log('Content already exists. Seed skipped so nothing is overwritten.')
  process.exit(0)
}

const skillIds = new Map<string, number>()
for (const [index, [name, group]] of SKILLS.entries()) {
  const status = statusFor('skills')
  const skill = await payload.create({
    collection: 'skills',
    data: { name, group, sortOrder: (index + 1) * 10, ...status.data } as never,
    draft: status.draft,
    overrideAccess: true,
  })
  skillIds.set(name, skill.id)
}
const skills = (...names: string[]) => names.map((name) => skillIds.get(name)).filter((id): id is number => id !== undefined)

const experienceStatus = statusFor('experiences')
const jobkred = await payload.create({
  collection: 'experiences',
  draft: experienceStatus.draft,
  overrideAccess: true,
  data: {
    ...experienceStatus.data,
    organization: 'Jobkred',
    location: 'Singapore',
    workMode: 'remote',
    sortOrder: 10,
    internalSource: `${CV_SOURCE} Current status follows the August 2026 CV; confirm before publishing. Employment type is not stated in the CV.`,
    engagements: [
      {
        role: 'Software Engineer, Full Stack',
        employmentType: 'full-time',
        startMonth: '2024-10',
        isCurrent: true,
        contributions: [
          { text: 'Architected and built a ReactFlow-based AI workflow canvas supporting 10+ node types, with DAG validation, acyclicity enforcement, and cron-based scheduled execution.' },
          { text: 'Engineered 5+ LLM-powered node agents (competency builder, skills diagnostic, career pathing) with structured prompt design and CSV/PDF artifact export.' },
          { text: 'Partnered with product and business stakeholders to scope and prioritize workflow agent features, and reviewed code for engineers on the platform team.' },
          { text: 'Delivered full-stack features including Stripe payments, Bugsnag error monitoring, email verification, a file upload and parse pipeline, and workflow completion notifications.' },
        ],
        technologies: skills('Python', 'FastAPI', 'Next.js', 'TypeScript', 'React', 'ReactFlow', 'Redis', 'PostgreSQL', 'OpenAI API'),
      },
    ],
  } as never,
})

const offerland = await payload.create({
  collection: 'experiences',
  draft: experienceStatus.draft,
  overrideAccess: true,
  data: {
    ...experienceStatus.data,
    organization: 'Offerland Technologies',
    workMode: 'remote',
    sortOrder: 20,
    internalSource: `${CV_SOURCE} Metrics are CV claims without documented methodology. The freelance role title is not stated in the CV; confirm.`,
    engagements: [
      {
        role: 'Backend Engineer',
        employmentType: 'full-time',
        startMonth: '2022-01',
        endMonth: '2024-10',
        contributions: [
          { text: 'Built and deployed web scraping infrastructure in Python and Django as microservices on GCP, processing 1M+ data points daily across 20+ e-commerce platforms.' },
          { text: 'Improved scraper performance 2x through container orchestration, distributed task queuing with Celery, and parallel processing, reducing infrastructure costs by 35%.' },
          { text: 'Reached 98% data accuracy with fault-tolerant design, automated quality validation pipelines, and anomaly detection.' },
          { text: 'Built monitoring dashboards and alerting that reduced response time to scraper failures by 80%, and mentored new engineers on the scraping infrastructure team.' },
        ],
        technologies: skills('Python', 'Django', 'Celery', 'Google Cloud Platform (GCP)', 'Docker'),
      },
      {
        role: 'Backend Engineer',
        employmentType: 'freelance',
        startMonth: '2020-06',
        endMonth: '2022-01',
        technologies: skills('Python', 'Django'),
      },
    ],
  } as never,
})

await payload.create({
  collection: 'experiences',
  draft: experienceStatus.draft,
  overrideAccess: true,
  data: {
    ...experienceStatus.data,
    organization: 'Tokopedia',
    location: 'Jakarta, Indonesia',
    sortOrder: 30,
    internalSource: `${CV_SOURCE} Internal only: the CV states "15% operational efficiency" and "94% service stability during peak events". Definitions are unavailable; do not publish as SLA or uptime. Employment type is not stated in the CV.`,
    engagements: [
      {
        role: 'Software Engineer',
        employmentType: 'full-time',
        startMonth: '2021-10',
        endMonth: '2022-01',
        overlapNote: 'Concurrent with the Offerland freelance engagement',
        contributions: [
          { text: 'Delivered a real-time analytics platform for the seller insights dashboard using event-driven microservices with Kafka, Go, and Redis.' },
          { text: 'Worked on resilience during peak traffic events such as flash sales and campaigns, using circuit breakers, rate limiting, and graceful degradation.' },
        ],
        technologies: skills('Go', 'Apache Kafka', 'Redis', 'Microservices Architecture'),
      },
    ],
  } as never,
})

const educationStatus = statusFor('education')
await payload.create({
  collection: 'education',
  draft: educationStatus.draft,
  overrideAccess: true,
  data: {
    ...educationStatus.data,
    institution: 'Bandung Institute of Technology (ITB)',
    qualification: 'Bachelor of Engineering',
    field: 'Informatics',
    startYear: 2017,
    endYear: 2021,
    gpa: '3.34 / 4.00',
    thesisTitle: 'Fraud Detection System using Convolutional Neural Networks (CNN)',
    notes: 'Teaching assistant: led weekly lab sessions for 50+ students in C, Python, and Haskell.',
    sortOrder: 10,
  } as never,
})

const profileStatus = statusFor('profile')
await payload.updateGlobal({
  slug: 'profile',
  draft: profileStatus.draft,
  overrideAccess: true,
  data: {
    ...profileStatus.data,
    displayName: 'Vincent Siauw',
    roleLabel: 'Software Engineer · Full Stack & AI Systems',
    heroHeading: 'Full-stack engineering for AI workflows and data systems.',
    heroIntro:
      'I build workflow tools, backend services, and data pipelines. My experience spans HR tech, e-commerce infrastructure, and seller analytics.',
    location: 'Jakarta, Indonesia',
    shortBio:
      'I own technical decisions from architecture through code review, and I work directly with product and business stakeholders to set requirements and priorities.',
    fullBio: doc(
      paragraph(
        'I am a full-stack engineer working on production AI systems and backend infrastructure. I currently build an LLM-powered workflow platform at a Singapore-based HR tech company.',
      ),
      paragraph(
        'I own technical decisions from architecture through code review, and I work directly with product and business stakeholders to set requirements and priorities.',
      ),
    ),
    email: 'jamesvincentsiauw@gmail.com',
    socialLinks: [
      { kind: 'github', label: 'GitHub', url: 'https://github.com/jamesvincentsiauw' },
      { kind: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/vincent-siauw' },
    ],
    relocationText: 'Indonesian citizen, open to international relocation. Visa sponsorship or work rights are discussed per role and country.',
    spokenLanguages: [
      { name: 'English', proficiency: 'Fluent' },
      { name: 'Indonesian', proficiency: 'Native' },
    ],
  } as never,
})

const settingsStatus = statusFor('settings')
await payload.updateGlobal({
  slug: 'site-settings',
  draft: settingsStatus.draft,
  overrideAccess: true,
  data: {
    ...settingsStatus.data,
    siteName: 'Vincent Siauw',
    defaultSeoTitle: 'Vincent Siauw · Software Engineer',
    defaultSeoDescription: 'Full-stack engineering for AI workflows, backend services, and data pipelines.',
  } as never,
})

// Projects: always drafts with contentReady=false. Titles are editorial proposals, not product names.
const projects = [
  {
    title: 'AI Workflow Builder',
    slug: 'ai-workflow-builder',
    summary: 'A ReactFlow-based canvas for composing AI workflows, with DAG validation, LLM-powered node agents, and scheduled execution.',
    category: 'ai-workflows',
    projectType: 'professional',
    organization: 'Jobkred',
    experience: jobkred.id,
    role: 'Software Engineer, Full Stack',
    startMonth: '2024-10',
    context: doc(paragraph('An LLM-powered workflow platform with multi-agent orchestration at a Singapore-based HR tech company.')),
    contribution: doc(
      bullets([
        'Architected and built the workflow canvas, including DAG validation, acyclicity enforcement, and cron-based scheduled execution.',
        'Engineered LLM-powered node agents (competency builder, skills diagnostic, career pathing) with structured prompt design and CSV/PDF artifact export.',
      ]),
    ),
    technologies: skills('ReactFlow', 'Next.js', 'TypeScript', 'Python', 'FastAPI', 'OpenAI API', 'Redis', 'PostgreSQL'),
    sortOrder: 10,
    internalNotes:
      'Needs before publishing: the user problem, team vs individual scope, decisions and tradeoffs, narrative outcome, and a public-safe example. Confirm whether counts from the CV (10+ node types, 5+ agents) may be published.',
  },
  {
    title: 'E-commerce Data Infrastructure',
    slug: 'e-commerce-data-infrastructure',
    summary: 'Scraping microservices and data pipelines for e-commerce data, with distributed task queues, quality validation, and monitoring.',
    category: 'data-infrastructure',
    projectType: 'professional',
    organization: 'Offerland Technologies',
    experience: offerland.id,
    role: 'Backend Engineer',
    startMonth: '2020-06',
    endMonth: '2024-10',
    context: doc(paragraph('Web scraping infrastructure and data pipelines collecting data across many e-commerce platforms, deployed as microservices on GCP.')),
    contribution: doc(
      bullets([
        'Built scraping microservices in Python and Django with Celery task queues and parallel processing.',
        'Designed pipeline stages for deduplication, normalization, automated quality validation, and anomaly detection.',
        'Built monitoring dashboards and alerting for scraper failures.',
      ]),
    ),
    technologies: skills('Python', 'Django', 'Celery', 'Google Cloud Platform (GCP)', 'Docker'),
    sortOrder: 20,
    internalNotes:
      'CV metrics (not yet in the metrics field): 1M+ data points/day, 20+ platforms, 2x performance, 35% cost reduction, 98% accuracy, 80% faster failure response. Needs baseline, measurement period, and a publishable diagram before use.',
  },
  {
    title: 'Real-time Seller Analytics',
    slug: 'real-time-seller-analytics',
    summary: 'Event-driven microservices behind a real-time seller insights dashboard.',
    category: 'data-infrastructure',
    projectType: 'professional',
    organization: 'Tokopedia',
    role: 'Software Engineer',
    startMonth: '2021-10',
    endMonth: '2022-01',
    context: doc(paragraph('A real-time analytics platform supporting a seller insights dashboard, including peak traffic events such as flash sales.')),
    technologies: skills('Go', 'Apache Kafka', 'Redis', 'Microservices Architecture'),
    sortOrder: 30,
    internalNotes:
      'Needs contribution scope, system boundaries, and result definitions. CV figures (15% efficiency, 94% stability) are ambiguous; keep internal.',
  },
  {
    title: 'CNN Fraud Detection Thesis',
    slug: 'cnn-fraud-detection-thesis',
    summary: 'Undergraduate thesis on a fraud detection system using convolutional neural networks.',
    category: 'research',
    projectType: 'academic',
    organization: 'Bandung Institute of Technology (ITB)',
    role: 'Undergraduate thesis author',
    sortOrder: 40,
    internalNotes: 'Needs dataset, evaluation method, results, and an abstract or repository before this can become a case study.',
  },
]

for (const project of projects) {
  await payload.create({
    collection: 'projects',
    draft: true,
    overrideAccess: true,
    data: { ...project, _status: 'draft', contentReady: false, internalSource: CV_SOURCE } as never,
  })
}

console.log(
  `Seed complete. Projects: ${projects.length} drafts. Published for local review: ${requested.size ? [...requested].join(', ') : 'nothing'}.`,
)
process.exit(0)
