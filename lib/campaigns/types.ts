// Campaign creation types and schemas
import { z } from 'zod'

// Source type schemas
export const UrlSourceSchema = z.object({
  type: z.literal('url'),
  url: z.string().url('Invalid URL format'),
})

export const TextSourceSchema = z.object({
  type: z.literal('text'),
  content: z.string().min(100, 'Content must be at least 100 characters').max(50000, 'Content too long (max 50,000 characters)'),
})

export const FileSourceSchema = z.object({
  type: z.literal('file'),
  fileData: z.string().min(1, 'File data required'), // base64 encoded
  fileName: z.string().min(1, 'File name required'),
  fileType: z.enum(['md', 'txt', 'pdf', 'docx'], { errorMap: () => ({ message: 'Unsupported file type. Allowed: .md, .txt, .pdf, .docx' }) }),
})

export const CampaignSourceSchema = z.discriminatedUnion('type', [
  UrlSourceSchema,
  TextSourceSchema,
  FileSourceSchema,
])

// CTA schema
export const CTASchema = z.object({
  label: z.string().min(1).max(100),
  href: z.string().url().optional(),
  variant: z.enum(['primary', 'secondary']).optional(),
})

// Metric schema
export const MetricSchema = z.object({
  label: z.string().min(1).max(50),
  value: z.string().min(1).max(20),
  note: z.string().max(200).optional(),
})

// Section schema
export const SectionSchema = z.object({
  type: z.string().min(1),
})

// Metadata schema
export const CampaignMetadataSchema = z.object({
  role: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  contract: z.string().max(100).optional(),
  period: z.string().max(100).optional(),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format').optional(),
  ctaVariant: z.enum(['filled', 'outline']).optional(),
  heroHeadline: z.string().max(200).optional(),
})

// Advanced options schema
export const CampaignAdvancedSchema = z.object({
  ctas: z.array(CTASchema).max(5).optional(),
  metrics: z.array(MetricSchema).max(10).optional(),
  sections: z.array(SectionSchema).max(20).optional(),
})

// Main request schema
export const CreateCampaignRequestSchema = z.object({
  source: CampaignSourceSchema,
  brandSlug: z.string()
    .min(2, 'Brand slug too short')
    .max(50, 'Brand slug too long')
    .regex(/^[a-z0-9-]+$/, 'Brand slug must be lowercase alphanumeric with hyphens'),
  industry: z.string().min(2, 'Industry required'),
  newIndustry: z.string().min(3).max(50).optional(),
  campaignSlug: z.string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-_]+$/, 'Campaign slug must be lowercase alphanumeric with hyphens/underscores')
    .optional(),
  metadata: CampaignMetadataSchema.optional(),
  advanced: CampaignAdvancedSchema.optional(),
})

// Processing step types
export type ProcessingStepStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ProcessingStep {
  name: string
  status: ProcessingStepStatus
  duration?: number
  error?: string
}

// Response schema
export const CreateCampaignResponseSchema = z.object({
  success: z.boolean(),
  campaignId: z.string(),
  brandSlug: z.string(),
  campaignSlug: z.string(),
  jobPostingId: z.string().optional(),
  steps: z.array(z.object({
    name: z.string(),
    status: z.enum(['pending', 'running', 'completed', 'failed']),
    duration: z.number().optional(),
    error: z.string().optional(),
  })),
  errors: z.array(z.string()).optional(),
})

// TypeScript types
export type CampaignSource = z.infer<typeof CampaignSourceSchema>
export type CreateCampaignRequest = z.infer<typeof CreateCampaignRequestSchema>
export type CreateCampaignResponse = z.infer<typeof CreateCampaignResponseSchema>
export type CampaignMetadata = z.infer<typeof CampaignMetadataSchema>
export type CampaignAdvanced = z.infer<typeof CampaignAdvancedSchema>
