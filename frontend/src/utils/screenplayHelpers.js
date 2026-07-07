import { ELEMENT_TYPES, TAB_ORDER } from '../constants/screenplay'

export function createBlock(type = ELEMENT_TYPES.ACTION, text = '') {
  return {
    id: crypto.randomUUID(),
    type,
    text,
  }
}

export function parseContent(content) {
  try {
    const parsed = JSON.parse(content || '[]')
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [createBlock(ELEMENT_TYPES.SCENE_HEADING, 'INT. LOCATION - DAY'), createBlock(ELEMENT_TYPES.ACTION, '')]
  } catch {
    return [createBlock(ELEMENT_TYPES.SCENE_HEADING, 'INT. LOCATION - DAY'), createBlock(ELEMENT_TYPES.ACTION, '')]
  }
}

export function nextElementType(current) {
  const idx = TAB_ORDER.indexOf(current)
  if (idx === -1) return ELEMENT_TYPES.ACTION
  return TAB_ORDER[(idx + 1) % TAB_ORDER.length]
}

export function prevElementType(current) {
  const idx = TAB_ORDER.indexOf(current)
  if (idx === -1) return ELEMENT_TYPES.ACTION
  return TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length]
}

export function nextOnEnter(current) {
  switch (current) {
    case ELEMENT_TYPES.SCENE_HEADING:
      return ELEMENT_TYPES.ACTION
    case ELEMENT_TYPES.CHARACTER:
      return ELEMENT_TYPES.DIALOGUE
    case ELEMENT_TYPES.DIALOGUE:
      return ELEMENT_TYPES.CHARACTER
    case ELEMENT_TYPES.PARENTHETICAL:
      return ELEMENT_TYPES.DIALOGUE
    case ELEMENT_TYPES.TRANSITION:
      return ELEMENT_TYPES.SCENE_HEADING
    default:
      return ELEMENT_TYPES.ACTION
  }
}

export function formatSceneHeading(value) {
  return value.toUpperCase()
}

export function formatCharacter(value) {
  return value.toUpperCase()
}

export function countWords(blocks) {
  return blocks.reduce((sum, b) => sum + (b.text?.trim() ? b.text.trim().split(/\s+/).length : 0), 0)
}

export function countScenes(blocks) {
  return blocks.filter((b) => b.type === ELEMENT_TYPES.SCENE_HEADING && b.text?.trim()).length
}

export function getUniqueCharacters(blocks) {
  return [...new Set(
    blocks
      .filter((b) => b.type === ELEMENT_TYPES.CHARACTER && b.text?.trim())
      .map((b) => b.text.trim().toUpperCase())
  )]
}

export function estimatePages(wordCount) {
  return Math.max(1, Math.ceil(wordCount / 250))
}
