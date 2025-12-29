import layerData from '../data/layerData.json'
import type { LayerData, Season } from '../types/layer'

/**
 * 根据季节、层级索引和纹理索引获取对应的 layer 数据
 * @param season 季节
 * @param layerIndex 层级索引 (1, 2, 3)
 * @param texIndex 纹理索引 (1, 2, 3)，可选，默认为 1
 * @returns LayerData 或 null（如果未找到）
 */
export function getLayerData(season: Season, layerIndex: 1 | 2 | 3, texIndex: number = 1): LayerData | null {
  const data = layerData as LayerData[]
  const found = data.find(
    (item) => item.season === season && item.layerIndex === layerIndex && (item.texIndex ?? 1) === texIndex
  )
  return found || null
}

/**
 * 获取某个季节的所有 layer 数据
 * @param season 季节
 * @returns LayerData 数组
 */
export function getLayerDataBySeason(season: Season): LayerData[] {
  const data = layerData as LayerData[]
  return data.filter((item) => item.season === season)
}

/**
 * 获取所有 layer 数据
 * @returns LayerData 数组
 */
export function getAllLayerData(): LayerData[] {
  return layerData as LayerData[]
}

