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

//  add a dummy test to make sure tests are running on PR new commits
describe('dummy test', () => {
  it('should return true', () => {
    expect(true).toBe(true)
  })
})