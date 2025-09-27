import { NextRequest, NextResponse } from 'next/server'
import { resolveMediaSource } from '@/lib/aiOriginalsMedia'
import { lookup } from 'mime-types'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
export const runtime = 'nodejs'

function nodeStreamToReadable(stream: NodeJS.ReadableStream): ReadableStream<Uint8Array> {
  let closed = false

  const destroyStream = () => {
    if (closed) return
    closed = true
    const destroy = (stream as { destroy?: () => void }).destroy
    if (typeof destroy === 'function') {
      destroy.call(stream)
    }
  }

  const safePause = () => {
    const pause = (stream as { pause?: () => void }).pause
    if (typeof pause === 'function') {
      pause.call(stream)
    }
  }

  const safeResume = () => {
    const resume = (stream as { resume?: () => void }).resume
    if (typeof resume === 'function') {
      resume.call(stream)
    }
  }

  const removeAllListeners = () => {
    stream.removeListener('data', onData as any)
    stream.removeListener('end', onEnd as any)
    stream.removeListener('close', onClose as any)
    stream.removeListener('error', onError as any)
  }

  const onData = (chunk: Buffer | string) => {
    if (closed) return
    const data = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    try {
      controllerRef?.enqueue(data)
    } catch {
      destroyStream()
      removeAllListeners()
    }
    if (!closed && controllerRef && controllerRef.desiredSize !== null && controllerRef.desiredSize <= 0) {
      safePause()
    }
  }

  const onEnd = () => {
    if (closed) return
    removeAllListeners()
    closed = true
    controllerRef?.close()
  }

  const onClose = () => {
    if (closed) return
    removeAllListeners()
    closed = true
    controllerRef?.close()
  }

  const onError = (error: unknown) => {
    if (closed) return
    removeAllListeners()
    closed = true
    controllerRef?.error(error)
  }

  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller
      stream.on('data', onData as any)
      stream.on('end', onEnd as any)
      stream.on('close', onClose as any)
      stream.on('error', onError as any)
    },
    pull() {
      if (!closed) {
        safeResume()
      }
    },
    cancel() {
      destroyStream()
      removeAllListeners()
      controllerRef = null
    },
  })
}
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await context.params
  const source = resolveMediaSource(slug, id)

  if (!source) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 })
  }

  try {
    const fileStat = await stat(source.sourcePath)
    const range = request.headers.get('range')
    const mime = lookup(source.sourcePath) || 'application/octet-stream'

    if (range) {
      const [rangeStart, rangeEnd] = range.replace(/bytes=/, '').split('-')
      let start = Number.parseInt(rangeStart, 10)
      let end = rangeEnd ? Number.parseInt(rangeEnd, 10) : fileStat.size - 1

      if (Number.isNaN(start)) start = 0
      if (Number.isNaN(end) || end >= fileStat.size) end = fileStat.size - 1

      if (start >= fileStat.size || end < start) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileStat.size}`,
          },
        })
      }

      const chunkSize = end - start + 1
      const stream = createReadStream(source.sourcePath, { start, end })

      return new NextResponse(nodeStreamToReadable(stream), {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileStat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    const stream = createReadStream(source.sourcePath)
    return new NextResponse(nodeStreamToReadable(stream), {
      headers: {
        'Content-Type': mime,
        'Content-Length': fileStat.size.toString(),
        'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    console.error('[AIOriginalsMedia] failed to stream file', error)
    return NextResponse.json({ error: 'Failed to stream media' }, { status: 500 })
  }
}
