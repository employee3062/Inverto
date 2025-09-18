import { describe, expect, it } from 'bun:test'
import { app } from '../index'

describe('inverto health check', () => {
  it('should return "It\'s Inverto ${version}"', async () => {
    const response = await app
            .handle(new Request('http://localhost:3000'))
            .then((res) => res.text())
    expect(response).toContain("It's Inverto")
  })
})

describe('swagger docs is present',()=>{
  it('should be an html document', async () => {
    const response = await app.fetch(new Request('http://localhost:3000/swagger'))
    const data = await response.text()
    expect(data).toContain('<!doctype html>')
  })
})