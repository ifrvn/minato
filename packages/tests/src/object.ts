import { $, Database } from '@minatojs/core'
import { expect } from 'chai'

interface ObjectModel {
  id: string
  meta?: {
    a?: string
    embed?: {
      b?: number
      c?: string
    }
  }
}

interface Tables {
  object: ObjectModel
}

function ObjectOperations(database: Database<Tables>) {
  database.extend('object', {
    'id': 'string',
    'meta.a': { type: 'string', initial: '666' },
    'meta.embed': { type: 'json', initial: { c: 'world' } },
  })
}

namespace ObjectOperations {
  async function setup(database: Database<Tables>) {
    await database.remove('object', {})
    const result: ObjectModel[] = []
    result.push(await database.create('object', { id: '0', meta: { a: '233', embed: { b: 2, c: 'hello' } } }))
    result.push(await database.create('object', { id: '1' }))
    expect(result).to.have.length(2)
    return result
  }

  export const get = function Get(database: Database<Tables>) {
    it('field extraction', async () => {
      await setup(database)
      const table = await database.get('object', {}, ['meta'])
      expect(table).to.deep.equal([
        { meta: { a: '233', embed: { b: 2, c: 'hello' } } },
        { meta: { a: '666', embed: { c: 'world' } } },
      ])
    })
  }

  export const upsert = function Upsert(database: Database<Tables>) {
    it('object literal', async () => {
      const table = await setup(database)
      table[0].meta = { a: '233', embed: { b: 114 } }
      table[1].meta = { a: '1', embed: { b: 514, c: 'world' } }
      table.push({ id: '2', meta: { a: '666', embed: { b: 1919 } } })
      table.push({ id: '3', meta: { a: 'foo', embed: { b: 810, c: 'world' } } })
      await expect(database.upsert('object', [
        { id: '0', meta: { embed: { b: 114 } } },
        { id: '1', meta: { a: { $: 'id' }, 'embed.b': { $add: [500, 14] } } },
        { id: '2', meta: { embed: { b: 1919 } } },
        { id: '3', meta: { a: 'foo', 'embed.b': 810 } },
      ])).eventually.fulfilled
      await expect(database.get('object', {})).to.eventually.deep.equal(table)
    })

    it('nested property', async () => {
      const table = await setup(database)
      table[0].meta = { a: '0', embed: { b: 114, c: 'hello' } }
      table[1].meta = { a: '1', embed: { b: 514 } }
      table.push({ id: '2', meta: { a: '2', embed: { b: 1919, c: 'world' } } })
      table.push({ id: '3', meta: { a: '3', embed: { b: 810 } } })
      await expect(database.upsert('object', row => [
        { id: '0', 'meta.a': row.id, 'meta.embed.b': 114 },
        { id: '1', 'meta.a': row.id, 'meta.embed': { b: 514 } },
        { id: '2', 'meta.a': row.id, 'meta.embed.b': $.multiply(19, 101) },
        { id: '3', 'meta.a': row.id, 'meta.embed': { b: 810 } },
      ])).eventually.fulfilled
      await expect(database.get('object', {})).to.eventually.deep.equal(table)
    })
  }

  export const modify = function Modify(database: Database<Tables>) {
    it('object literal', async () => {
      const table = await setup(database)
      table[0].meta = { a: '0', embed: { b: 114 } }
      table[1].meta = { a: '1', embed: { b: 514, c: 'world' } }
      await expect(database.set('object', '0', {
        meta: { a: { $: 'id' }, embed: { b: 114 } },
      })).eventually.fulfilled
      await expect(database.set('object', '1', {
        meta: { a: { $: 'id' }, 'embed.b': 514 },
      })).eventually.fulfilled
      await expect(database.get('object', {})).to.eventually.deep.equal(table)
    })

    it('nested property', async () => {
      const table = await setup(database)
      table[0].meta = { a: '0', embed: { b: 114, c: 'hello' } }
      table[1].meta = { a: '1', embed: { b: 514 } }
      await expect(database.set('object', '0', row => ({
        'meta.a': row.id,
        'meta.embed.b': 114,
      }))).eventually.fulfilled
      await expect(database.set('object', '1', row => ({
        'meta.a': row.id,
        'meta.embed': { b: 514 },
      }))).eventually.fulfilled
      await expect(database.get('object', {})).to.eventually.deep.equal(table)
    })
  }
}

export default ObjectOperations
