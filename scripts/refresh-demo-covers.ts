import 'dotenv/config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../src/payload.config'
import { getStorageDriver, getS3Settings } from '../src/lib/storage'

const local = (url: string) => ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname)
if (!local(process.env.DATABASE_URL || '') || getStorageDriver() !== 's3' || !local(String(getS3Settings().config.endpoint || ''))) {
  throw new Error('This script only updates local demo content and local object storage.')
}

const palette = ['#e7eee5', '#ede9df', '#e4eaf0']
const titles = ['AI Workflow Studio', 'Commerce Data Pipeline', 'Seller Event Insights']
const slugs = ['demo-ai-workflow-studio', 'demo-commerce-data-pipeline', 'demo-seller-event-insights']
const box = (x: number, y: number, w: number, title: string, note: string) => `<rect x="${x}" y="${y}" width="${w}" height="100" rx="8" fill="#fff" stroke="#4b6055"/><text x="${x + 20}" y="${y + 40}" font-size="25">${title}</text><text x="${x + 20}" y="${y + 72}" font-size="18">${note}</text>`
const edge = (path: string) => `<path d="${path}" fill="none" stroke="#4b6055" stroke-width="2"/>`

function artwork(index: number) {
  const body = index === 0
    ? `${box(60,270,240,'Input','A reusable brief')}${box(460,180,260,'Research agent','Gather source material')}${box(460,390,260,'Review agent','Check the draft')}${box(900,270,240,'Human review','Approve the output')}${edge('M300 320 H380 V230 H460 M380 320 V440 H460 M720 230 H810 V320 H900 M720 440 H810 V320')}`
    : index === 1
      ? `${box(60,220,210,'Collect','Source records')}${box(350,220,210,'Validate','Check the schema')}${box(640,220,210,'Normalize','A common format')}${box(930,220,210,'Deliver','Ready to query')}${box(350,430,300,'Review queue','Inspect and retry failures')}${edge('M270 270 H350 M560 270 H640 M850 270 H930 M455 320 V430 M350 480 H160 V320')}`
      : `<path d="M100 330 H1100" stroke="#536579" stroke-width="3"/>${[180,420,660,940].map((x,i)=>`<circle cx="${x}" cy="330" r="12" fill="#354957"/><path d="M${x} 350 V${i%2 ? 440:410}" stroke="#536579"/><text x="${x}" y="${i%2?480:450}" text-anchor="middle" font-size="24">${['Event received','Stream consumed','Read model updated','Insights refreshed'][i]}</text><text x="${x}" y="280" text-anchor="middle" font-size="20">${['Receive','Process','Materialize','Display'][i]}</text>`).join('')}<rect x="100" y="550" width="1000" height="52" rx="4" fill="#fff"/><text x="125" y="584" font-size="20">Freshness is shown explicitly; this illustration contains no measured event timings.</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750"><rect width="1200" height="750" fill="${palette[index]}"/><g font-family="Helvetica,Arial,sans-serif" fill="#293b33"><text x="60" y="75" font-size="20">DEMO / ${['WORKFLOW CANVAS','PIPELINE STAGES','EVENT TIMELINE'][index]}</text><text x="60" y="135" font-size="42">${titles[index]}</text>${body}<text x="60" y="705" font-size="20">Concept illustration. Not a screenshot or production architecture.</text></g></svg>`
}

const payload = await getPayload({config})
try {
  for (const [index, slug] of slugs.entries()) {
    const found = await payload.find({collection:'projects', where:{slug:{equals:slug}}, draft:true, depth:0, overrideAccess:true, limit:1})
    const project = found.docs[0]
    const history = project ? await payload.findVersions({collection:'projects', where:{parent:{equals:project.id}}, sort:'createdAt', limit:1, overrideAccess:true}) : null
    const original = history?.docs[0]?.version
    const fields = ['title','summary','category','role','organization','context','contribution','decisions','outcome','cover','technologies','gallery','links','seo','internalNotes'] as const
    const unchanged = project && original && fields.every(field => JSON.stringify(project[field] ?? null) === JSON.stringify(original[field] ?? null))
    const canReplace = project && project.title === titles[index] && unchanged && project._status === 'published'
    const existingMedia = await payload.find({collection:'media', where:{downloadName:{equals:`${slug}-v2.png`}}, limit:1, overrideAccess:true})
    const data = await sharp(Buffer.from(artwork(index))).png().toBuffer()
    const media = existingMedia.docs[0] ?? await payload.create({collection:'media', overrideAccess:true, data:{
      alt: `Demo ${['branching agent workflow with human review','data pipeline with a failure review queue','event timeline with freshness information'][index]}.`,
      caption:'Demo concept diagram. Replace with your own project image.',
      downloadName:`${slug}-v2.png`, visibility:'public', contentReady:true,
    }, file:{data, mimetype:'image/png', name:`${slug}-v2.png`, size:data.length}})
    if (!canReplace) {
      console.log(`Prepared alternate cover ${media.id} for ${slug}; kept current project unchanged.`)
      continue
    }
    await payload.update({collection:'projects', id:project.id, overrideAccess:true, draft:false, data:{cover:media.id}})
    console.log(`Updated only cover for ${slug}: media ${media.id}`)
  }
} finally {
  await payload.destroy()
}
process.exit(0)
