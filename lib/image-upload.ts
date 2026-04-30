import sharp from 'sharp'

export type ImagePurpose = 'poster' | 'avatar' | 'team-avatar' | 'team-banner'

type ImageConstraints = {
  maxBytes: number
  maxWidth: number
  maxHeight: number
  outputWidth?: number
  outputHeight?: number
}

const constraints: Record<ImagePurpose, ImageConstraints> = {
  poster: { maxBytes: 10 * 1024 * 1024, maxWidth: 3000, maxHeight: 4500, outputWidth: 1200 },
  avatar: { maxBytes: 2 * 1024 * 1024, maxWidth: 2000, maxHeight: 2000, outputWidth: 512, outputHeight: 512 },
  'team-avatar': { maxBytes: 5 * 1024 * 1024, maxWidth: 2400, maxHeight: 2400, outputWidth: 512, outputHeight: 512 },
  'team-banner': { maxBytes: 10 * 1024 * 1024, maxWidth: 5000, maxHeight: 2500, outputWidth: 1920 },
}

const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])

function hasKnownImageSignature(buffer: Buffer, type: string): boolean {
  if (type === 'image/jpeg' || type === 'image/jpg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }
  if (type === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  }
  if (type === 'image/webp') {
    return buffer.length >= 12 && buffer.subarray(0, 4).equals(Buffer.from('RIFF')) && buffer.subarray(8, 12).equals(Buffer.from('WEBP'))
  }
  if (type === 'image/gif') {
    return buffer.subarray(0, 4).equals(Buffer.from('GIF8'))
  }
  return false
}

export async function prepareImageUpload(file: File, purpose: ImagePurpose) {
  const config = constraints[purpose]

  if (!allowedTypes.has(file.type)) {
    return { error: 'Invalid file type' }
  }

  if (file.size > config.maxBytes) {
    return { error: `File too large (max ${Math.floor(config.maxBytes / 1024 / 1024)}MB)` }
  }

  const input = Buffer.from(await file.arrayBuffer())
  if (!hasKnownImageSignature(input, file.type)) {
    return { error: 'Invalid image content' }
  }

  const image = sharp(input, { animated: false, limitInputPixels: config.maxWidth * config.maxHeight })
  const metadata = await image.metadata()

  if (!metadata.width || !metadata.height) {
    return { error: 'Invalid image dimensions' }
  }

  if (metadata.width > config.maxWidth || metadata.height > config.maxHeight) {
    return { error: `Image dimensions too large (max ${config.maxWidth}x${config.maxHeight})` }
  }

  const resize =
    config.outputWidth || config.outputHeight
      ? {
          width: config.outputWidth,
          height: config.outputHeight,
          fit: config.outputHeight ? ('cover' as const) : ('inside' as const),
          withoutEnlargement: true,
        }
      : undefined

  const buffer = await sharp(input, { animated: false })
    .rotate()
    .resize(resize)
    .webp({ quality: 82, effort: 4 })
    .toBuffer()

  return {
    buffer,
    extension: 'webp',
    contentType: 'image/webp',
    width: metadata.width,
    height: metadata.height,
  }
}
