import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import gsap from 'gsap'
import { getLayerData } from '../utils/layerData'
import type { Season } from '../types/layer'
import './LayerDetail.css'

interface LayerDetailProps {
  season: Season
  layerIndex: 1 | 2 | 3
  onClose: () => void
}

export default function LayerDetail({ season, layerIndex, onClose }: LayerDetailProps) {
  const layerData = getLayerData(season, layerIndex)
  const descriptionRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!layerData || layerData.animationType !== 'flood') return

    // 为每一行创建潮水动画
    descriptionRefs.current.forEach((ref, index) => {
      if (!ref) return

      const delay = index * 0.4 // 错落排开：每行延迟不同，形成波浪效果
      const duration = 4 + Math.random() * 3 // 4-7秒，每行速度略有不同
      const verticalOffset = (Math.random() - 0.5) * 30 // 垂直随机偏移，让文字错落
      const horizontalOffset = (Math.random() - 0.5) * 20 // 水平随机偏移

      // 潮水效果：上下移动 + 若隐若现（移动幅度为原来的三倍）
      gsap.fromTo(
        ref,
        {
          y: 100 + verticalOffset,
          x: horizontalOffset,
          opacity: 0.2,
        },
        {
          y: -100 + verticalOffset,
          x: horizontalOffset,
          opacity: 0.85,
          duration: duration,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: delay,
        }
      )
    })

    // 清理函数：组件卸载时停止动画
    return () => {
      descriptionRefs.current.forEach((ref) => {
        if (ref) {
          gsap.killTweensOf(ref)
        }
      })
    }
  }, [layerData])

  // 如果没有数据，显示返回按钮
  if (!layerData) {
    return (
      <div className="layer-detail-overlay">
        <button className="layer-detail-exit" onClick={onClose}>
          <span className="exit-icon">→</span>
          <span>Exit</span>
        </button>
      </div>
    )
  }

  // 构建texture图片路径（只做路径计算，不负责加载）
  // 注意：Vite配置了base URL为 /coast-layers/
  const textureBase = layerData.texture || 'default'
  const texturePath = `/coast-layers/textures/v_${textureBase}.png`
  // 移除 fallback 图片，如果图片不存在，会显示 container 的黑色背景
  
  // 调试：输出路径
  console.log('Texture path:', texturePath)
  console.log('Texture base:', textureBase)
  console.log('Full path should be:', texturePath)

  return (
    <div className="layer-detail-overlay">
      {/* 返回按钮 - 右上角 */}
      <button className="layer-detail-exit" onClick={onClose}>
        <span className="exit-icon">→</span>
        <span>Exit</span>
      </button>

      {/* 左上方标题区域 */}
      <div className="layer-detail-header">
        <h1 className="layer-detail-title">{layerData.name}</h1>
        <div className="layer-detail-subtitle">
          <div className="subtitle-line">{season.toUpperCase()}-</div>
          <div className="subtitle-line">{layerData.introduction}</div>
        </div>
      </div>

      {/* 中央内容区域 */}
      <div className="layer-detail-content">
        {/* Texture 图片容器 - 包含overlay文字 */}
        <div className="layer-detail-texture-container">
          {/* Texture 图片 - 使用CSS background-image加载 */}
          <div 
            className="layer-detail-texture"
            style={{
              backgroundImage: textureBase !== 'default' ? `url('${texturePath}')` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* Description 文字 - Flood 动画 - Overlay在texture上方 */}
          {layerData.animationType === 'flood' && (
            <div 
              className="layer-detail-description flood-animation"
              style={{
                color: layerData.color || 'rgba(255, 255, 255, 0.9)',
              }}
            >
              {(() => {
                const lines = layerData.description.split('\n').filter(line => line.trim())
                const processedLines: JSX.Element[] = []
                let refIndex = 0

                lines.forEach((line, index) => {
                  // 每行前面添加随机空格（0-4个）
                  const leadingSpaces = ' '.repeat(Math.floor(Math.random() * 200))
                  const processedLine = leadingSpaces + line.trim()

                  processedLines.push(
                    <div
                      key={`line-${index}`}
                      className="description-line"
                      ref={(el) => {
                        descriptionRefs.current[refIndex] = el
                        refIndex++
                      }}
                    >
                      {processedLine}
                    </div>
                  )

                  // 句子之间随机添加1-2个空行（呼吸感）
                  if (index < lines.length - 1) {
                    const emptyLinesCount = Math.floor(Math.random() * 2) + 1 // 1-2个空行
                    for (let i = 0; i < emptyLinesCount; i++) {
                      processedLines.push(
                        <div key={`empty-${index}-${i}`} className="description-line-empty" />
                      )
                    }
                  }
                })

                return processedLines
              })()}
            </div>
          )}

          {/* 其他动画类型可以在这里扩展 */}
          {layerData.animationType !== 'flood' && (
            <div className="layer-detail-description">
              {layerData.description.split('\n').map((line, index) => (
                <div key={index} className="description-line">
                  {line.trim()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

