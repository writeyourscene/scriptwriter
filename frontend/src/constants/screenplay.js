export const ELEMENT_TYPES = {
  ACTION: 'ACTION',
  SCENE_HEADING: 'SCENE_HEADING',
  CHARACTER: 'CHARACTER',
  DIALOGUE: 'DIALOGUE',
  PARENTHETICAL: 'PARENTHETICAL',
  TRANSITION: 'TRANSITION',
  SHOT: 'SHOT',
  LYRICS: 'LYRICS',
  TITLE_PAGE: 'TITLE_PAGE',
  NOTE: 'NOTE',
  SYNOPSIS: 'SYNOPSIS',
  BEAT: 'BEAT',
}

export const ELEMENT_LABELS = {
  ACTION: 'Action',
  SCENE_HEADING: 'Scene',
  CHARACTER: 'Character',
  DIALOGUE: 'Dialogue',
  PARENTHETICAL: 'Parenthetical',
  TRANSITION: 'Transition',
  SHOT: 'Shot',
  LYRICS: 'Lyrics',
  TITLE_PAGE: 'Title Page',
  NOTE: 'Note',
  SYNOPSIS: 'Synopsis',
  BEAT: 'Beat',
}

export const TAB_ORDER = [
  ELEMENT_TYPES.SCENE_HEADING,
  ELEMENT_TYPES.ACTION,
  ELEMENT_TYPES.CHARACTER,
  ELEMENT_TYPES.DIALOGUE,
  ELEMENT_TYPES.PARENTHETICAL,
  ELEMENT_TYPES.TRANSITION,
]

export const SCENE_HEADING_SUGGESTIONS = {
  I: ['INT.', 'INT/EXT.'],
  E: ['EXT.', 'EXT/INT.'],
}

export const TRANSITION_SUGGESTIONS = [
  'CUT TO:',
  'FADE OUT.',
  'FADE IN:',
  'MATCH CUT:',
  'DISSOLVE TO:',
  'SMASH CUT:',
]

export const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200]

export const EDITOR_THEMES = {
  dark: { bg: '#1a1a1a', page: '#ffffff', text: '#000000' },
  light: { bg: '#e8e8e8', page: '#ffffff', text: '#000000' },
  sepia: { bg: '#3d3530', page: '#f4ecd8', text: '#3d3530' },
}
