import { describe, expect, it } from 'vitest'
import { awaitingReply } from '@/lib/admin/support-inbox'
import { bubbleState } from '@/lib/support-bubble-state'

const ticket = (id: string, msgs: [string | null, string, boolean?][]) => ({
  id, subject: 'Assunto ' + id, status: 'open', created_at: '2026-10-01T10:00:00Z', profile_id: 'aluno',
  profiles: { full_name: 'Ana', email: 'ana@vet.com' },
  support_messages: msgs.map(([sender_id, created_at, is_internal = false]) => ({ sender_id, created_at, is_internal })),
})

describe('awaitingReply', () => {
  it('lista chamados cuja última mensagem é do aluno, marcando os ainda sem resposta como novos', () => {
    const items = awaitingReply([
      ticket('novo', [['aluno', '2026-10-02T10:00:00Z']]),
      ticket('respondido', [['aluno', '2026-10-02T10:00:00Z'], ['equipe', '2026-10-02T11:00:00Z']]),
      ticket('voltou', [['aluno', '2026-10-01T10:00:00Z'], ['equipe', '2026-10-01T11:00:00Z'], ['aluno', '2026-10-03T09:00:00Z']]),
    ])
    expect(items.map(i => [i.id, i.isNew])).toEqual([['voltou', false], ['novo', true]])
    expect(items[0].student).toBe('Ana')
  })
  it('ignora notas internas da equipe', () => {
    const items = awaitingReply([ticket('nota', [['aluno', '2026-10-02T10:00:00Z'], ['equipe', '2026-10-02T11:00:00Z', true]])])
    expect(items).toHaveLength(1)
  })
})

describe('bubbleState', () => {
  const data = { ticket: { id: 't1' }, messages: [{ id: 'm1', own: true }, { id: 'm2', own: false }] }
  it('mostra o botão com aviso de resposta nova', () => {
    expect(bubbleState(data, { dismissed: '', seen: '' })).toEqual({ key: 't1:m2', visible: true, unread: true })
  })
  it('ocultar vale até a próxima mensagem', () => {
    expect(bubbleState(data, { dismissed: 't1:m2', seen: 't1:m2' }).visible).toBe(false)
    const next = { ...data, messages: [...data.messages, { id: 'm3', own: false }] }
    expect(bubbleState(next, { dismissed: 't1:m2', seen: 't1:m2' })).toMatchObject({ visible: true, unread: true })
  })
  it('sem chamado aberto não aparece', () => expect(bubbleState(null, { dismissed: '', seen: '' }).visible).toBe(false))
})
