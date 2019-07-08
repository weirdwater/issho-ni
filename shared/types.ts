
export const clientTypes = ['source', 'presenter'] as const

export type ClientType = typeof clientTypes[number]

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

interface Song {
  title: string
  artist: string
  components: SongComponent[]
}

interface LyricComponent {
  kind: 'lyrics'
  name: string
  lines: string[]
}

interface ReferenceComponent {
  kind: 'reference'
  component: SongComponent
}

type SongComponent = LyricComponent | ReferenceComponent
