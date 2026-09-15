import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * Limited Lexical editor (TRD §3): paragraph, h2/h3, lists, external links, quote, image with
 * caption, inline code. No raw HTML, embeds, or internal document links.
 */
export const limitedEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    InlineCodeFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    LinkFeature({ enabledCollections: [], disableAutoLinks: true }),
    UploadFeature({
      collections: {
        media: {
          fields: [{ name: 'caption', type: 'text', label: 'Caption', maxLength: 200 }],
        },
      },
    }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})
