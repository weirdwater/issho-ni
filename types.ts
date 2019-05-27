
interface Client {
  id: string
  ipAddresses: string[]
  key: string
  streams: Stream[]
}

interface Stream {
  id: string
  client: Client
  session: Session
  link: string
}

interface Session {
  id: string
  token: string
  name: string
  connectionLimit: number
  streams: Stream[]
  songs: Song[]
  songStatus: SongStatus
}

interface User {
  id: string
  email: string
  passwordHash: string
  sessions: Session[]
  name: string
  emailConfirmed: boolean
  active: boolean
}

interface Song {
  title: string
  artist: string
  lyrics: string[]
}

interface SongStatus {
  song: number
  lyric: number
}
