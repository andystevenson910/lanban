export interface CardColor {
  id: string
  bg: string
  label: string
}

export const CARD_COLORS: CardColor[] = [
  { id: 'yellow', bg: '#fef08a', label: 'Yellow' },
  { id: 'orange', bg: '#fed7aa', label: 'Orange' },
  { id: 'pink',   bg: '#fbcfe8', label: 'Pink' },
  { id: 'red',    bg: '#fca5a5', label: 'Red' },
  { id: 'purple', bg: '#e9d5ff', label: 'Purple' },
  { id: 'sky',    bg: '#bae6fd', label: 'Blue' },
  { id: 'mint',   bg: '#a7f3d0', label: 'Green' },
  { id: 'lime',   bg: '#d9f99d', label: 'Lime' },
  { id: 'white',  bg: '#f0f0ee', label: 'White' },
]

// Hidden easter-egg color — unlocked in the edit modal by trying every color above.
export const RAINBOW_COLOR: CardColor = { id: 'rainbow', bg: '#ffffff', label: 'Rainbow' }

export const DEFAULT_COLOR = 'yellow'

export function getCardColor(id?: string): CardColor {
  if (id === RAINBOW_COLOR.id) return RAINBOW_COLOR
  return CARD_COLORS.find((c) => c.id === id) ?? CARD_COLORS[0]
}
