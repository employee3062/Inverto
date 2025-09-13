import { describe, expect, it } from 'bun:test'
import {app} from '../index'

describe('inverto health check', () => {
  it('should return It\'s Inverto', async () => {
    const response = await app
            .handle(new Request('http://localhost:3000'))
            .then((res) => res.text())
    expect(response).toBe('It\'s Inverto')
  })
})

// check is swagger is returning 200 and a html response on /swagger
describe('swagger', () => {
  it('should return 200 and a html response', async () => {
    const response = await app
            .handle(new Request('http://localhost:3000/swagger'))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
  })
})