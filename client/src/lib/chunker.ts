export const CHUNK_SIZE = 64 * 1024 // 64KB

export interface ChunkIterator {
  totalChunks: number
  [Symbol.asyncIterator](): AsyncIterator<{ index: number; buffer: ArrayBuffer }>
}

export function createChunkIterator(file: File): ChunkIterator {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

  return {
    totalChunks,
    async *[Symbol.asyncIterator]() {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const slice = file.slice(start, end)
        const buffer = await slice.arrayBuffer()

        // Prepend 4-byte chunk index (uint32 big-endian) + 4-byte total (for validation)
        const tagged = new ArrayBuffer(buffer.byteLength + 8)
        const view = new DataView(tagged)
        view.setUint32(0, i, false)
        view.setUint32(4, totalChunks, false)
        new Uint8Array(tagged, 8).set(new Uint8Array(buffer))

        yield { index: i, buffer: tagged }
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
