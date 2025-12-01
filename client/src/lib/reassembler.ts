import type { TransferMetadata } from './types.ts'

export class Reassembler {
  private chunks = new Map<number, ArrayBuffer>()
  readonly metadata: TransferMetadata

  constructor(metadata: TransferMetadata) {
    this.metadata = metadata
  }

  addChunk(index: number, data: ArrayBuffer): boolean {
    this.chunks.set(index, data)
    return this.chunks.size === this.metadata.totalChunks
  }

  get receivedCount(): number {
    return this.chunks.size
  }

  assemble(): Blob {
    const ordered = Array.from({ length: this.metadata.totalChunks }, (_, i) => {
      const chunk = this.chunks.get(i)
      if (!chunk) throw new Error(`Missing chunk ${i}`)
      return chunk
    })
    return new Blob(ordered, { type: this.metadata.mimeType })
  }

  progress(): number {
    if (this.metadata.totalChunks === 0) return 1
    return this.chunks.size / this.metadata.totalChunks
  }
}
