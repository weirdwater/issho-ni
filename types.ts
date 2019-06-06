
export type ClientType = 'source' | 'presenter'

// Concept Types
interface ConceptClient {
  id: string
  ipAddresses: string[]
  key: string
  streams: ConceptStream[]
}

interface ConceptStream {
  id: string
  client: ConceptClient
  session: ConceptSession
  link: string
}

interface ConceptSession {
  id: string
  token: string
  name: string
  connectionLimit: number
  streams: ConceptStream[]
  songs: ConceptSong[]
  songStatus: ConceptSongStatus
}

interface ConceptUser {
  id: string
  email: string
  passwordHash: string
  sessions: ConceptSession[]
  name: string
  emailConfirmed: boolean
  active: boolean
}

interface ConceptSong {
  title: string
  artist: string
  lyrics: string[]
}

interface ConceptSongStatus {
  song: number
  lyric: number
}
