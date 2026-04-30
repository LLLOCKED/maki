import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'

export { z }

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    {
      error: 'Invalid request',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    },
    { status: 400 }
  )
}

export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<z.infer<T> | NextResponse> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error)
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}

export function isValidationResponse<T>(
  value: T | NextResponse
): value is NextResponse {
  return value instanceof NextResponse
}

const optionalNullableString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .nullable()
  .transform((value) => value || null)

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .nullable()
  .transform((value) => value || null)

const idArray = z.array(z.string().trim().min(1)).default([])

export const createNovelSchema = z.object({
  title: z.string().trim().min(1).max(200),
  originalName: optionalNullableString,
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(1).max(20000),
  coverUrl: optionalNullableString,
  type: z.enum(['ORIGINAL', 'JAPAN', 'KOREA', 'CHINA', 'ENGLISH']).default('ORIGINAL'),
  status: z.enum(['ONGOING', 'COMPLETED', 'SUSPENDED']).default('ONGOING'),
  translationStatus: z.enum(['TRANSLATING', 'DROPPED', 'COMPLETED', 'HIATUS']).default('TRANSLATING'),
  releaseYear: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  genreIds: idArray,
  tagIds: idArray,
  publisherIds: idArray,
  authorIds: idArray,
  sourceUrl: optionalUrl,
  isExplicit: z.boolean().default(false),
  contentWarnings: z.array(z.string().trim().min(1).max(80)).default([]),
  donationUrl: optionalUrl,
})

export const createChapterSchema = z.object({
  title: z.string().trim().min(1).max(200),
  number: z.coerce.number().int().positive(),
  volume: z.coerce.number().int().positive().optional().nullable(),
  content: z.string().max(200000).default(''),
  novelId: z.string().trim().min(1),
  teamId: z.string().trim().min(1).optional().nullable(),
})

export const addTeamMemberSchema = z.object({
  userId: z.string().trim().min(1),
  role: z.enum(['member', 'admin']).default('member'),
})

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .nullable()
    .transform((value) => value || null),
  image: optionalNullableString,
})

export const createCommentSchema = z
  .object({
    content: z.string().trim().min(1).max(10000),
    novelId: z.string().trim().min(1).optional().nullable(),
    chapterId: z.string().trim().min(1).optional().nullable(),
    parentId: z.string().trim().min(1).optional().nullable(),
  })
  .refine((value) => Boolean(value.novelId || value.chapterId), {
    message: 'novelId or chapterId is required',
    path: ['novelId'],
  })

export const createForumTopicSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20000),
  categoryId: z.string().trim().min(1),
  novelId: z.string().trim().min(1).optional().nullable(),
})

export const deleteUploadSchema = z.object({
  filename: z.string().trim().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/),
  folder: z.string().trim().max(255).regex(/^(avatars|posters|teams\/[a-zA-Z0-9_-]+)$/).default(''),
})

export const ratingSchema = z.object({
  novelId: z.string().trim().min(1),
  value: z.coerce.number().int().min(1).max(5),
})

export const bookmarkSchema = z.object({
  novelId: z.string().trim().min(1),
  status: z.enum(['reading', 'planned', 'completed', 'dropped']),
  readingPosition: z.coerce.number().int().positive().optional().nullable(),
})

export const novelIdSchema = z.object({
  novelId: z.string().trim().min(1),
})

export const bookmarkPositionSchema = z.object({
  novelId: z.string().trim().min(1),
  chapterNumber: z.coerce.number().int().positive(),
})

export const collectionCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  novelIds: z.array(z.string().trim().min(1)).default([]),
  isPublic: z.boolean().default(false),
})

export const collectionUpdateSchema = collectionCreateSchema.extend({
  id: z.string().trim().min(1),
})

export const collectionMutationSchema = z.object({
  collectionId: z.string().trim().min(1),
  novelId: z.string().trim().min(1),
  action: z.enum(['add', 'remove']),
})

export const forumVoteSchema = z.object({
  topicId: z.string().trim().min(1),
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
})

export const forumCommentSchema = z.object({
  content: z.string().trim().min(1).max(10000),
  parentId: z.string().trim().min(1).optional().nullable(),
})

export const moderationActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
})

export const announcementSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: optionalNullableString,
  posterUrl: optionalNullableString,
  linkUrl: z.string().trim().min(1).max(500),
  linkType: z.enum(['novel', 'forum', 'page', 'external']),
  tag: z.enum(['news', 'popular', 'attention', 'new', 'featured']),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
})

export const namedEntitySchema = z.object({
  name: z.string().trim().min(1).max(120),
})

export const sluggedEntitySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
})

export const forumCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: optionalNullableString,
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
  order: z.coerce.number().int().default(0),
})

export const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: optionalNullableString,
})

export const updateTeamSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: optionalNullableString,
  avatarUrl: optionalNullableString,
  bannerUrl: optionalNullableString,
})

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(8).max(128),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(8).max(128),
})

export const banUserSchema = z.object({
  ban: z.boolean(),
  reason: z.string().trim().max(500).optional().nullable(),
})

export const warnUserSchema = z.object({
  reason: z.string().trim().min(1).max(500),
})

export const adminLogSchema = z.object({
  action: z.string().trim().min(1).max(100),
  targetId: optionalNullableString,
  targetType: optionalNullableString,
  details: z.unknown().optional(),
})
