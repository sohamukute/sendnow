export const CHUNK_SIZE = 64 * 1024

export interface ChunkIterator {
  totalChunks: number
  [Symbol.asyncIterator](): AsyncIterator<{ index: number; buffer: ArrayBuffer }>
}

function readChunk(file: File, index: number, totalChunks: number): Promise<ArrayBuffer> {
  const start = index * CHUNK_SIZE
  const buffer = file.slice(start, Math.min(start + CHUNK_SIZE, file.size)).arrayBuffer()
  return buffer.then(buf => {
    const tagged = new ArrayBuffer(buf.byteLength + 8)
    const view = new DataView(tagged)
    view.setUint32(0, index, false)
    view.setUint32(4, totalChunks, false)
    new Uint8Array(tagged, 8).set(new Uint8Array(buf))
    return tagged
  })
}

export function createChunkIterator(file: File): ChunkIterator {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

  return {
    totalChunks,
    async *[Symbol.asyncIterator]() {
      let ahead = readChunk(file, 0, totalChunks)
      for (let i = 0; i < totalChunks; i++) {
        const buffer = await ahead
        if (i + 1 < totalChunks) ahead = readChunk(file, i + 1, totalChunks)
        yield { index: i, buffer }
      }
    },
  }
}

export function extractChunkData(tagged: ArrayBuffer): { index: number; total: number; data: ArrayBuffer } {
  const view = new DataView(tagged)
  const index = view.getUint32(0, false)
  const total = view.getUint32(4, false)
  const data = tagged.slice(8)
  return { index, total, data }
}
