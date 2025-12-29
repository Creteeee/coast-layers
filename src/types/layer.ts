export type AnimationType = 'flood' | 'flash' | 'fade' | 'slide' | 'wave' | 'particle' | 'none'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export interface LayerData {
  season: Season
  layerIndex: 1 | 2 | 3
  texIndex?: number
  name: string
  introduction: string
  description: string
  animationType: AnimationType
  // 可选的扩展字段
  color?: string
  texture?: string
}

