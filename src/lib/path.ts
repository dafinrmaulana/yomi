import { GROUPS, type KanaGroup, type Script } from './kana'
import type { QuizConfig } from './quiz'

export interface PathNode {
  id: string
  script: Script
  group: KanaGroup
  index: number
}

export const nodesFor = (script: Script): PathNode[] =>
  GROUPS[script].map((group, index) => ({ id: `${script}:${group.id}`, script, group, index }))

export const isUnlocked = (node: PathNode, completed: Record<string, number>) =>
  node.index === 0 || (completed[nodesFor(node.script)[node.index - 1].id] ?? 0) > 0

export function lessonConfig(node: PathNode): QuizConfig {
  const review = GROUPS[node.script].slice(0, node.index).flatMap((g) => g.kana)
  return {
    kind: 'path',
    title: `${node.group.label}`,
    pool: node.group.kana,
    review,
    mode: 'single',
    length: 1,
    answer: 'mix',
    total: 10,
    hearts: true,
    nodeId: node.id,
  }
}
