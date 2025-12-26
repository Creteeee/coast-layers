import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import gsap from 'gsap'
import { getLayerData } from '../utils/layerData'
import type { Season } from '../types/layer'
import P5Sketch from './P5Sketch'
import './LayerDetail.css'

interface LayerDetailProps {
  season: Season
  layerIndex: 1 | 2 | 3
  texIndex?: number
  onClose: () => void
}

export default function LayerDetail({ season, layerIndex, texIndex = 1, onClose }: LayerDetailProps) {
  // texIndex 目前未在 UI 中展示，先标记使用以通过构建；后续可用于根据切片索引筛选/高亮
  void texIndex
  
  // 添加调试信息
  console.log('🎯 LayerDetail: 组件被渲染', { season, layerIndex, isAutumnLayer2: season === 'autumn' && layerIndex === 2 })
  console.error('🎯 LayerDetail: 组件被渲染 (ERROR级别，确保可见)', { season, layerIndex, isAutumnLayer2: season === 'autumn' && layerIndex === 2 })
  
  const layerData = getLayerData(season, layerIndex)
  console.log('LayerDetail: layerData', { layerData, hasLayerData: !!layerData })
  const descriptionRefs = useRef<(HTMLDivElement | null)[]>([])
  const textureContainerRef = useRef<HTMLDivElement | null>(null)
  
  // 使用容器尺寸，而不是窗口尺寸
  const [containerSize, setContainerSize] = useState({ 
    width: 1920, 
    height: 1080 
  })

  // 监听容器尺寸变化
  useEffect(() => {
    const updateContainerSize = () => {
      if (textureContainerRef.current) {
        const rect = textureContainerRef.current.getBoundingClientRect()
        setContainerSize({ 
          width: rect.width, 
          height: rect.height 
        })
        console.log('LayerDetail: 容器尺寸更新', { 
          width: rect.width, 
          height: rect.height 
        })
      }
    }

    // 初始设置
    updateContainerSize()

    // 使用 ResizeObserver 监听容器尺寸变化
    let resizeObserver: ResizeObserver | null = null
    if (textureContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateContainerSize)
      resizeObserver.observe(textureContainerRef.current)
    }

    // 同时也监听窗口 resize（作为后备）
    window.addEventListener('resize', updateContainerSize)

    return () => {
      if (resizeObserver && textureContainerRef.current) {
        resizeObserver.unobserve(textureContainerRef.current)
      }
      window.removeEventListener('resize', updateContainerSize)
    }
  }, [])

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

  // 如果是 autumn layer2，即使没有 layerData 也允许渲染（用于显示 P5.js 效果）
  const isAutumnLayer2 = season === 'autumn' && layerIndex === 2
  
  // 如果没有数据且不是 autumn layer2，显示返回按钮
  if (!layerData && !isAutumnLayer2) {
    return (
      <div className="layer-detail-overlay">
        <button className="layer-detail-exit" onClick={onClose}>
          <img src="/coast-layers/textures/btn_exit.png" alt="Exit" />
        </button>
      </div>
    )
  }

  // 构建texture图片路径（只做路径计算，不负责加载）
  // 注意：Vite配置了base URL为 /coast-layers/
  const textureBase = layerData?.texture || 'default'
  const texturePath = `/coast-layers/textures/v_${textureBase}.png`
  // 移除 fallback 图片，如果图片不存在，会显示 container 的黑色背景
  
  // 调试：输出路径
  if (layerData) {
    console.log('Texture path:', texturePath)
    console.log('Texture base:', textureBase)
    console.log('Full path should be:', texturePath)
  }

  return (
    <div className="layer-detail-overlay">
      {/* 返回按钮 - 右上角 */}
      <button className="layer-detail-exit" onClick={onClose}>
        <img src="/coast-layers/textures/btn_exit.png" alt="Exit" />
      </button>

      {/* 左上方标题区域 */}
      {layerData && (
        <div className="layer-detail-header">
          <h1 className="layer-detail-title">{layerData.name}</h1>
          <div className="layer-detail-subtitle">
            <div className="subtitle-line">{season.toUpperCase()}-</div>
            <div className="subtitle-line">{layerData.introduction}</div>
          </div>
        </div>
      )}

      {/* 中央内容区域 */}
      <div className="layer-detail-content" style={{ minHeight: '100vh' }}>
        {/* Texture 图片容器 - 包含overlay文字 */}
        <div 
          ref={textureContainerRef}
          className="layer-detail-texture-container" 
          style={{ minHeight: '100vh' }}
        >
          {/* Autumn layer2 使用 P5.js 效果 */}
          {(() => {
            const shouldShowP5 = season === 'autumn' && layerIndex === 2
            console.log('🔍 LayerDetail: 检查是否显示 P5Sketch', { 
              season, 
              layerIndex, 
              shouldShowP5,
              seasonType: typeof season,
              seasonValue: season,
              layerIndexType: typeof layerIndex,
              layerIndexValue: layerIndex,
              containerSize 
            })
            if (shouldShowP5) {
              console.error('✅ LayerDetail: 应该显示 P5Sketch！', { 
                season, 
                layerIndex, 
                shouldShowP5, 
                containerSize 
              })
            } else {
              console.warn('❌ LayerDetail: 不显示 P5Sketch', { 
                season, 
                layerIndex, 
                shouldShowP5,
                seasonCheck: season === 'autumn',
                layerIndexCheck: layerIndex === 2
              })
            }
            return shouldShowP5
          })() ? (
            <div 
              className="layer-detail-texture"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: 'transparent',
                zIndex: 1,
              }}
            >
              {(() => {
                console.error('✅✅✅ LayerDetail: 准备渲染 P5Sketch (ERROR级别)', { containerSize })
                return null
              })()}
              <P5Sketch 
                width={containerSize.width} 
                height={containerSize.height} 
                className="p5-fullscreen"
              />
            </div>
          ) : (
            /* Texture 图片 - 使用CSS background-image加载 */
            <div 
              className="layer-detail-texture"
              style={{
                backgroundImage: textureBase !== 'default' ? `url('${texturePath}')` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          )}

          {/* Description 文字 - Flood 动画 - Overlay在texture上方 */}
          {layerData && layerData.animationType === 'flood' && (
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
          {layerData && layerData.animationType !== 'flood' && (
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

