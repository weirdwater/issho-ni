
export class ApiException extends Error {
  constructor(m?: string) {
    super(m)
    this.name = 'ApiException'
  }
}
