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
