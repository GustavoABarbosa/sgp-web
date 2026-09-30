import type { MockDb } from '@/types'
import { initialDb } from './initialDb'

const STORAGE_KEY = 'sgp-mock-db:v2'

function load(): MockDb {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as MockDb
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
  return structuredClone(initialDb)
}

let current = load()

export function db(): MockDb {
  return current
}

export function saveDb() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
}

export function resetDb() {
  current = structuredClone(initialDb)
  saveDb()
}
