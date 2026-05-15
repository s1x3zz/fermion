import Dexie, { type Table } from 'dexie'
import type { FermionProject, BreadboardCircuit } from '@fermion/core'

export interface DraftRecord {
  key: string              // always 'autosave'
  circuit: BreadboardCircuit
  savedAt: number
}

class FermionDB extends Dexie {
  projects!: Table<FermionProject>
  drafts!: Table<DraftRecord>

  constructor() {
    super('fermion-local')
    this.version(1).stores({
      projects: 'id, name, updatedAt',
    })
    this.version(2).stores({
      projects: 'id, name, updatedAt',
      drafts: 'key',
    })
  }
}

export const db = new FermionDB()
