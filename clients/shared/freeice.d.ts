
declare module 'freeice' {
  export default function freeice(options?: { stun?: number, turn?: number }): RTCIceServer[]
}
