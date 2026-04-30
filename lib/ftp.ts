import { Client, FTPError } from 'basic-ftp'
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

const FTP_CONFIG = {
  host: process.env.FTP_HOST!,
  port: parseInt(process.env.FTP_PORT!),
  user: process.env.FTP_USER!,
  password: process.env.FTP_PASSWORD!,
  secure: true,
  secureOptions: { rejectUnauthorized: false },
}

const BASE_URL = 'https://edge-drive.cdn.express'

export async function uploadToFTP(
  buffer: Buffer,
  filename: string,
  folder: string = ''
): Promise<string> {
  const client = new Client()

  // Write buffer to temp file
  const tempDir = '/tmp'
  const tempFile = join(tempDir, `${randomUUID()}-${filename}`)
  writeFileSync(tempFile, buffer)

  try {
    await client.access(FTP_CONFIG)
    // Ensure folder exists
    if (folder) {
      await client.ensureDir(folder)
    }

    // Upload from temp file
    await client.uploadFrom(tempFile, filename)

    // Build public URL
    const path = folder ? `/${folder}/${filename}` : `/${filename}`
    return `${BASE_URL}${path}`
  } finally {
    client.close()
    // Clean up temp file
    if (existsSync(tempFile)) {
      unlinkSync(tempFile)
    }
  }
}

export async function deleteFromFTP(filename: string, folder: string): Promise<void> {
  const client = new Client()

  try {
    await client.access(FTP_CONFIG)
    const path = folder ? `${folder}/${filename}` : filename
    await client.remove(path)
  } catch (error) {
    console.error('FTP delete error:', error)
    if ((error as FTPError).code !== 550) {
      throw error // 550 = file not found, ignore
    }
  } finally {
    client.close()
  }
}