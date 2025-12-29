import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import gsap from 'gsap'
import { getLayerData } from '../utils/layerData'
import type { Season } from '../types/layer'
import P5Sketch from './P5Sketch'
import P5TextCarving from './P5TextCarving'
import P5WaveText from './P5WaveText'
import './LayerDetail.css'

interface LayerDetailProps {
  season: Season
  layerIndex: 1 | 2 | 3
  texIndex?: number
  onClose: () => void
}

export default function LayerDetail({ season, layerIndex, texIndex = 1, onClose }: LayerDetailProps) {
  // texIndex 用于区分同一个 layer 的不同部分（1, 2, 3）
  
  // 添加调试信息
  console.log('🎯 LayerDetail: 组件被渲染', { season, layerIndex, texIndex, isAutumnLayer2: season === 'autumn' && layerIndex === 2 })
  console.error('🎯 LayerDetail: 组件被渲染 (ERROR级别，确保可见)', { season, layerIndex, texIndex, isAutumnLayer2: season === 'autumn' && layerIndex === 2 })
  
  const layerData = getLayerData(season, layerIndex, texIndex)
  console.log('LayerDetail: layerData', { layerData, hasLayerData: !!layerData, season, layerIndex, texIndex })
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
        const newSize = { 
          width: Math.max(rect.width, 1), // 确保宽度至少为 1
          height: Math.max(rect.height, 1) // 确保高度至少为 1
        }
        setContainerSize(newSize)
        console.log('LayerDetail: 容器尺寸更新', { 
          width: newSize.width, 
          height: newSize.height,
          rect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          }
        })
      }
    }

    // 延迟初始设置，确保 DOM 完全渲染
    const timeoutId = setTimeout(() => {
      updateContainerSize()
    }, 0)

    // 使用 ResizeObserver 监听容器尺寸变化
    let resizeObserver: ResizeObserver | null = null
    if (textureContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        // 使用 requestAnimationFrame 确保在下一帧更新
        requestAnimationFrame(() => {
          updateContainerSize()
        })
      })
      resizeObserver.observe(textureContainerRef.current)
    }

    // 同时也监听窗口 resize（作为后备）
    window.addEventListener('resize', updateContainerSize)

    return () => {
      clearTimeout(timeoutId)
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

  // 如果是 autumn layer2、spring layer1 texIndex=1、spring layer1 texIndex=2、summer layer1 texIndex=1、summer layer1 texIndex=2、summer layer1 texIndex=3、autumn layer1 texIndex=1、autumn layer1 texIndex=2、winter layer1 texIndex=1、spring layer2 texIndex=1、spring layer2 texIndex=2、summer layer2 texIndex=1、summer layer2 texIndex=2、autumn layer2 texIndex=2、winter layer2 texIndex=1、winter layer2 texIndex=2、spring layer3 texIndex=1、spring layer3 texIndex=2、spring layer3 texIndex=3、summer layer3 texIndex=1、summer layer3 texIndex=2、autumn layer3 texIndex=1、autumn layer3 texIndex=2、winter layer3 texIndex=1 或 winter layer3 texIndex=2，即使没有 layerData 也允许渲染（用于显示 P5.js 效果）
  const isAutumnLayer2 = season === 'autumn' && layerIndex === 2
  const isSpringLayer1Part1 = season === 'spring' && layerIndex === 1 && texIndex === 1
  const isSpringLayer1Part2 = season === 'spring' && layerIndex === 1 && texIndex === 2
  const isSummerLayer1Part1 = season === 'summer' && layerIndex === 1 && texIndex === 1
  const isSummerLayer1Part2 = season === 'summer' && layerIndex === 1 && texIndex === 2
  const isSummerLayer1Part3 = season === 'summer' && layerIndex === 1 && texIndex === 3
  const isAutumnLayer1Part1 = season === 'autumn' && layerIndex === 1 && texIndex === 1
  const isAutumnLayer1Part2 = season === 'autumn' && layerIndex === 1 && texIndex === 2
  const isWinterLayer1Part1 = season === 'winter' && layerIndex === 1 && texIndex === 1
  const isSpringLayer2Part1 = season === 'spring' && layerIndex === 2 && texIndex === 1
  const isSpringLayer2Part2 = season === 'spring' && layerIndex === 2 && texIndex === 2
  const isSummerLayer2Part1 = season === 'summer' && layerIndex === 2 && texIndex === 1
  const isSummerLayer2Part2 = season === 'summer' && layerIndex === 2 && texIndex === 2
  const isAutumnLayer2Part2 = season === 'autumn' && layerIndex === 2 && texIndex === 2
  const isWinterLayer2Part1 = season === 'winter' && layerIndex === 2 && texIndex === 1
  const isWinterLayer2Part2 = season === 'winter' && layerIndex === 2 && texIndex === 2
  const isSpringLayer3Part1 = season === 'spring' && layerIndex === 3 && texIndex === 1
  const isSpringLayer3Part2 = season === 'spring' && layerIndex === 3 && texIndex === 2
  const isSpringLayer3Part3 = season === 'spring' && layerIndex === 3 && texIndex === 3
  const isSummerLayer3Part1 = season === 'summer' && layerIndex === 3 && texIndex === 1
  const isSummerLayer3Part2 = season === 'summer' && layerIndex === 3 && texIndex === 2
  const isAutumnLayer3Part1 = season === 'autumn' && layerIndex === 3 && texIndex === 1
  const isAutumnLayer3Part2 = season === 'autumn' && layerIndex === 3 && texIndex === 2
  const isWinterLayer3Part1 = season === 'winter' && layerIndex === 3 && texIndex === 1
  const isWinterLayer3Part2 = season === 'winter' && layerIndex === 3 && texIndex === 2
  
  // 如果没有数据且不是特殊 P5.js 场景，显示返回按钮
  if (!layerData && !isAutumnLayer2 && !isSpringLayer1Part1 && !isSpringLayer1Part2 && !isSummerLayer1Part1 && !isSummerLayer1Part2 && !isSummerLayer1Part3 && !isAutumnLayer1Part1 && !isAutumnLayer1Part2 && !isWinterLayer1Part1 && !isSpringLayer2Part1 && !isSpringLayer2Part2 && !isSummerLayer2Part1 && !isSummerLayer2Part2 && !isAutumnLayer2Part2 && !isWinterLayer2Part1 && !isWinterLayer2Part2 && !isSpringLayer3Part1 && !isSpringLayer3Part2 && !isSpringLayer3Part3 && !isSummerLayer3Part1 && !isSummerLayer3Part2 && !isAutumnLayer3Part1 && !isAutumnLayer3Part2 && !isWinterLayer3Part1 && !isWinterLayer3Part2) {
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
      {layerData && !isSpringLayer1Part1 && !isSpringLayer1Part2 && !isSummerLayer1Part1 && !isSummerLayer1Part2 && !isSummerLayer1Part3 && !isAutumnLayer1Part1 && !isAutumnLayer1Part2 && !isWinterLayer1Part1 && (
      <div className="layer-detail-header">
        <h1 className="layer-detail-title">{layerData.name}</h1>
        <div className="layer-detail-subtitle">
          <div className="subtitle-line">{season.toUpperCase()}-</div>
          <div className="subtitle-line">{layerData.introduction}</div>
        </div>
      </div>
      )}
      
      {/* 对于 spring layer1 texIndex=1，也显示 header */}
      {isSpringLayer1Part1 && layerData && (
      <div className="layer-detail-header">
        <h1 className="layer-detail-title">{layerData.name}</h1>
        <div className="layer-detail-subtitle">
          <div className="subtitle-line">{season.toUpperCase()}-</div>
          <div className="subtitle-line">{layerData.introduction}</div>
        </div>
      </div>
      )}
      
      {/* 对于 spring layer1 texIndex=2，也显示 header */}
      {isSpringLayer1Part2 && layerData && (
      <div className="layer-detail-header">
        <h1 className="layer-detail-title">{layerData.name}</h1>
        <div className="layer-detail-subtitle">
          <div className="subtitle-line">{season.toUpperCase()}-</div>
          <div className="subtitle-line">{layerData.introduction}</div>
        </div>
      </div>
      )}
      
      {/* 对于 spring layer2 texIndex=1，也显示 header */}
      {isSpringLayer2Part1 && layerData && (
      <div className="layer-detail-header">
        <h1 className="layer-detail-title">{layerData.name}</h1>
        <div className="layer-detail-subtitle">
          <div className="subtitle-line">{season.toUpperCase()}-</div>
          <div className="subtitle-line">{layerData.introduction}</div>
        </div>
      </div>
      )}
      
      {/* 对于 spring layer2 texIndex=2，也显示 header */}
      {isSpringLayer2Part2 && layerData && (
      <div className="layer-detail-header">
        <h1 className="layer-detail-title">{layerData.name}</h1>
        <div className="layer-detail-subtitle">
          <div className="subtitle-line">{season.toUpperCase()}-</div>
          <div className="subtitle-line">{layerData.introduction}</div>
        </div>
      </div>
      )}
      
      {/* 对于 summer layer1 texIndex=1，也显示 header */}
      {isSummerLayer1Part1 && layerData && (
      <div className="layer-detail-header">
        <h1 className="layer-detail-title">{layerData.name}</h1>
        <div className="layer-detail-subtitle">
          <div className="subtitle-line">{season.toUpperCase()}-</div>
          <div className="subtitle-line">{layerData.introduction}</div>
        </div>
      </div>
      )}
      
      {/* 对于 summer layer2 texIndex=1，也显示 header */}
      {isSummerLayer2Part1 && layerData && (
      <div className="layer-detail-header">
        <h1 className="layer-detail-title">{layerData.name}</h1>
        <div className="layer-detail-subtitle">
          <div className="subtitle-line">{season.toUpperCase()}-</div>
          <div className="subtitle-line">{layerData.introduction}</div>
        </div>
      </div>
      )}
      
      {/* 对于 autumn layer1 texIndex=1，也显示 header */}
      {isAutumnLayer1Part1 && layerData && (
      <div className="layer-detail-header">
        <h1 className="layer-detail-title">{layerData.name}</h1>
        <div className="layer-detail-subtitle">
          <div className="subtitle-line">{season.toUpperCase()}-</div>
          <div className="subtitle-line">{layerData.introduction}</div>
        </div>
      </div>
      )}
      
      {/* 对于 autumn layer2，也显示 header */}
      {isAutumnLayer2 && layerData && (
      <div className="layer-detail-header">
        <h1 className="layer-detail-title">{layerData.name}</h1>
        <div className="layer-detail-subtitle">
          <div className="subtitle-line">{season.toUpperCase()}-</div>
          <div className="subtitle-line">{layerData.introduction}</div>
        </div>
      </div>
      )}
      
      {/* 对于 winter layer1 texIndex=1，也显示 header */}
      {isWinterLayer1Part1 && layerData && (
      <div className="layer-detail-header">
        <h1 className="layer-detail-title">{layerData.name}</h1>
        <div className="layer-detail-subtitle">
          <div className="subtitle-line">{season.toUpperCase()}-</div>
          <div className="subtitle-line">{layerData.introduction}</div>
        </div>
      </div>
      )}
      
      {/* 对于 winter layer2 texIndex=1，也显示 header */}
      {isWinterLayer2Part1 && layerData && (
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
          {/* Spring/Summer/Autumn/Winter layer1 texIndex=1 使用 P5WaveText 效果 */}
          {(() => {
            // 明确只处理 texIndex === 1 的情况
            if (texIndex !== 1) return null
            
            const isSpringLayer1Part1 = season === 'spring' && layerIndex === 1 && texIndex === 1
            const isSummerLayer1Part1 = season === 'summer' && layerIndex === 1 && texIndex === 1
            const isAutumnLayer1Part1 = season === 'autumn' && layerIndex === 1 && texIndex === 1
            const isWinterLayer1Part1 = season === 'winter' && layerIndex === 1 && texIndex === 1
            const shouldShowP5WaveText = isSpringLayer1Part1 || isSummerLayer1Part1 || isAutumnLayer1Part1 || isWinterLayer1Part1
            
            if (!shouldShowP5WaveText) return null
            
            // 根据不同的季节设置不同的图片路径
            // 注意：如果某个季节的图片不存在，会使用 spring_layer1_1.png 作为默认
            let imagePath = '/coast-layers/p5-assets/images/spring_layer1_1.png'
            if (isSummerLayer1Part1) {
              // 如果存在 summer_layer1_1.png，使用它；否则使用 spring 的图片
              imagePath = '/coast-layers/p5-assets/images/spring_layer1_1.png'
            } else if (isAutumnLayer1Part1) {
              // 如果存在 autumn_layer1_1.png，使用它；否则使用 spring 的图片
              imagePath = '/coast-layers/p5-assets/images/spring_layer1_1.png'
            } else if (isWinterLayer1Part1) {
              // 如果存在 winter_layer1_1.png，使用它；否则使用 spring 的图片
              imagePath = '/coast-layers/p5-assets/images/spring_layer1_1.png'
            }
            
            // 生成一个基于内容的 key，确保不同场景时组件重新创建
            const uniqueKey = `p5-wave-text-${season}-${layerIndex}-${texIndex}-${imagePath}-${containerSize.width}-${containerSize.height}`
            
            return (
              <div className="layer-detail-texture">
                <P5WaveText 
                  key={uniqueKey}
                  width={containerSize.width} 
                  height={containerSize.height} 
                  className="p5-fullscreen"
                  imagePath={imagePath}
                  fontPath="/coast-layers/p5-assets/fonts/LetterGothicStd-Bold.otf"
                />
              </div>
            )
          })()}
          
          {/* Spring layer1 texIndex=2 使用 P5WaveText 效果（自定义文字内容） */}
          {(() => {
            const isSpringLayer1Part2 = season === 'spring' && layerIndex === 1 && texIndex === 2
            if (!isSpringLayer1Part2) return null
            
            // 新的文字内容，从上到下工整排布
            // 使用相对位置，根据容器高度计算 y 坐标
            // 从顶部 33% 开始，每行之间间距为容器高度的 10%
            const startY = containerSize.height * 0.33 // 起始位置：33%
            const lineSpacing = containerSize.height * 0.1 // 行间距：10%
            
            const texts = [
              {
                text: "Mud rip-up pebbles form when cohesive mud layers are torn apart by sudden increases in water energy.",
                x: containerSize.width * 0.1, // 左边距 10%
                y: startY // 第一行
              },
              {
                text: "These pebbles are records of interruption.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 1 // 第二行
              },
              {
                text: "Carried briefly and preserved quickly, mud rip-up pebbles capture the instant when a surface lost its continuity and\nbecame memory embedded in sediment.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 2 // 第三行
              },
              {
                text: "What was once a continuous surface is fractured, lifted, and transported as discrete fragments, later redeposited\nwithin sand or silt.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 3 // 第四行
              },
              {
                text: "They mark moments when calm conditions were abruptly broken—by tides, floods, or shifting currents—allowing\nerosion to become both destructive and archival.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 4 // 第五行
              }
            ]
            
            // 生成一个基于文本内容的 key，确保文本变化时组件重新创建
            const textsKey = texts.map(t => t.text).join('|').substring(0, 100)
            
            return (
              <div className="layer-detail-texture">
                <P5WaveText 
                  key={`spring-layer1-part2-${textsKey}-${containerSize.width}-${containerSize.height}`}
                  width={containerSize.width} 
                  height={containerSize.height} 
                  className="p5-fullscreen"
                  imagePath="/coast-layers/p5-assets/images/spring_layer1_2.png"
                  fontPath="/coast-layers/p5-assets/fonts/LetterGothicStd-Bold.otf"
                  texts={texts}
                />
              </div>
            )
          })()}
          
          {/* Summer layer1 texIndex=2 使用 P5WaveText 效果（自定义文字内容） */}
          {(() => {
            // 明确只处理 summer layer1 texIndex=2 的情况
            if (season !== 'summer' || layerIndex !== 1 || texIndex !== 2) return null
            
            // 新的文字内容，从上到下工整排布
            // 使用相对位置，根据容器高度计算 y 坐标
            // 从顶部 33% 开始，每行之间间距为容器高度的 10%
            const startY = containerSize.height * 0.33 // 起始位置：33%
            const lineSpacing = containerSize.height * 0.1 // 行间距：10%
            
            const texts = [
              {
                text: "Cross bedding records the quiet movement of sediment under flowing water or wind.",
                x: containerSize.width * 0.1, // 左边距 10%
                y: startY // 第一行
              },
              {
                text: "As currents shift direction, layers of sand or silt are deposited at an angle, forming inclined internal\nstructures that cut across the main bedding plane.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 1 // 第二行
              },
              {
                text: "These slanted layers are not random.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 2 // 第三行
              },
              {
                text: "They preserve the memory of flow—its direction, strength, and rhythm—capturing moments when particles were lifted,\ntransported, and gently laid down again.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 3 // 第四行
              },
              {
                text: "Cross bedding is, in this sense, a frozen trace of motion, where time is stored as geometry.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 4 // 第五行
              }
            ]
            
            // 生成一个基于文本内容的 key，确保文本变化时组件重新创建
            const textsKey = texts.map(t => t.text).join('|').substring(0, 100)
            
            return (
              <div className="layer-detail-texture">
                <P5WaveText 
                  key={`summer-layer1-part2-${textsKey}-${containerSize.width}-${containerSize.height}`}
                  width={containerSize.width} 
                  height={containerSize.height} 
                  className="p5-fullscreen"
                  imagePath="/coast-layers/p5-assets/images/summer_layer1_2.png"
                  fontPath="/coast-layers/p5-assets/fonts/LetterGothicStd-Bold.otf"
                  texts={texts}
                />
              </div>
            )
          })()}
          
          {/* Summer layer1 texIndex=3 使用 P5WaveText 效果（自定义文字内容） */}
          {(() => {
            // 明确只处理 summer layer1 texIndex=3 的情况
            if (season !== 'summer' || layerIndex !== 1 || texIndex !== 3) return null
            
            // 新的文字内容，从上到下工整排布
            // 使用相对位置，根据容器高度计算 y 坐标
            // 从顶部 33% 开始，每行之间间距为容器高度的 10%
            const startY = containerSize.height * 0.33 // 起始位置：33%
            const lineSpacing = containerSize.height * 0.1 // 行间距：10%
            
            const texts = [
              {
                text: "Regular flooding by seawater delivers sediment and nutrients, while dense plant growth slows water flow, promoting\nfurther deposition and vertical accretion of the marsh surface.",
                x: containerSize.width * 0.1, // 左边距 10%
                y: startY // 第一行
              },
              {
                text: "Beneath the vegetation, sediments are shaped by a combination of tidal inundation, root growth, and microbial\nactivity. Organic matter accumulates as plants grow and decay, binding mineral particles into cohesive layers that\nretain water and resist erosion.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 1 // 第二行
              },
              {
                text: "At the same time, tidal channels and creeks carve through the marsh, redistributing sediments and maintaining\nconnections between land and sea.Over longer timescales, salt marshes function as transitional environments—neither\nfully terrestrial nor fully marine.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 2 // 第三行
              },
              {
                text: "They buffer wave energy, record fluctuations in sea level, preserve traces of biological and sedimentary processes.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 3 // 第四行
              },
              {
                text: "In this layered landscape, living plants, water movement, and deposited sediments merge into a slowly evolving\narchive of coastal change.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 4 // 第五行
              }
            ]
            
            // 生成一个基于文本内容的 key，确保文本变化时组件重新创建
            const textsKey = texts.map(t => t.text).join('|').substring(0, 100)
            
            return (
              <div className="layer-detail-texture">
                <P5WaveText 
                  key={`summer-layer1-part3-${textsKey}-${containerSize.width}-${containerSize.height}`}
                  width={containerSize.width} 
                  height={containerSize.height} 
                  className="p5-fullscreen"
                  imagePath="/coast-layers/p5-assets/images/summer_layer1_3.png"
                  fontPath="/coast-layers/p5-assets/fonts/LetterGothicStd-Bold.otf"
                  texts={texts}
                />
              </div>
            )
          })()}
          
          {/* Autumn layer1 texIndex=2 使用 P5WaveText 效果（自定义文字内容） */}
          {(() => {
            // 明确只处理 autumn layer1 texIndex=2 的情况
            if (season !== 'autumn' || layerIndex !== 1 || texIndex !== 2) return null
            
            // 新的文字内容，从上到下工整排布
            // 使用相对位置，根据容器高度计算 y 坐标
            // 从顶部 35% 开始，每行之间间距为容器高度的 8%（因为共有6行）
            const startY = containerSize.height * 0.35 // 起始位置：35%
            const lineSpacing = containerSize.height * 0.08 // 行间距：8%
            
            const texts = [
              {
                text: "Gravel and sandy gravel consist of coarse sediment particles deposited under relatively high-energy conditions.",
                x: containerSize.width * 0.1, // 左边距 10%
                y: startY // 第一行
              },
              {
                text: "These materials form where currents or waves are strong enough to remove finer grains, leaving behind a\nframework of pebbles and coarse sand that resists further transport.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 1 // 第二行
              },
              {
                text: "The spaces between gravel particles allow water to pass through easily, making these layers highly permeable and\nwell-drained.As a result, gravelly sediments respond quickly to changes in water level, drying and rewetting more\nrapidly than finer deposits.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 2 // 第三行
              },
              {
                text: "Their surfaces are unstable, shifting with each energetic event rather than accumulating long-term stratification.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 3.25 // 第四行（更靠近第三行，间距10%；更远离第五行，间距6%）
              },
              {
                text: "Within coastal and tidal environments, gravel and sandy gravel often mark zones of intensified movement—such as\nchannel margins, wave-exposed shorelines, or reworked layers beneath finer sediments.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 4 // 第五行
              },
              {
                text: "They represent moments when energy dominates over accumulation, recording conditions where transport outweighs\npreservation and the landscape remains in a state of continual adjustment.",
                x: containerSize.width * 0.1,
                y: startY + lineSpacing * 5 // 第六行
              }
            ]
            
            // 生成一个基于文本内容的 key，确保文本变化时组件重新创建
            const textsKey = texts.map(t => t.text).join('|').substring(0, 100)
            
            return (
              <div className="layer-detail-texture">
                <P5WaveText 
                  key={`autumn-layer1-part2-${textsKey}-${containerSize.width}-${containerSize.height}`}
                  width={containerSize.width} 
                  height={containerSize.height} 
                  className="p5-fullscreen"
                  imagePath="/coast-layers/p5-assets/images/autumn_layer1_2.png"
                  fontPath="/coast-layers/p5-assets/fonts/LetterGothicStd-Bold.otf"
                  texts={texts}
                />
              </div>
            )
          })()}
          
          {/* Autumn layer2、Spring layer2 和 Summer layer2 使用 P5Sketch 效果 */}
          {(() => {
            const isAutumnLayer2 = season === 'autumn' && layerIndex === 2
            const isSpringLayer2Part1 = season === 'spring' && layerIndex === 2 && texIndex === 1
            const isSpringLayer2Part2 = season === 'spring' && layerIndex === 2 && texIndex === 2
            const isSummerLayer2Part1 = season === 'summer' && layerIndex === 2 && texIndex === 1
            const isSummerLayer2Part2 = season === 'summer' && layerIndex === 2 && texIndex === 2
            const isAutumnLayer2Part2 = season === 'autumn' && layerIndex === 2 && texIndex === 2
            const isWinterLayer2Part1 = season === 'winter' && layerIndex === 2 && texIndex === 1
            const isWinterLayer2Part2 = season === 'winter' && layerIndex === 2 && texIndex === 2
            const shouldShowP5Sketch = isAutumnLayer2 || isSpringLayer2Part1 || isSpringLayer2Part2 || isSummerLayer2Part1 || isSummerLayer2Part2 || isAutumnLayer2Part2 || isWinterLayer2Part1 || isWinterLayer2Part2
            
            if (!shouldShowP5Sketch) return null
            
            // 根据不同的场景设置不同的参数
            let imagePath: string | undefined
            let textContent: string | string[] | undefined
            let textX: number | undefined
            let textY: number | undefined
            let paragraphSpacing: number | undefined
            let showStaticText: boolean | undefined
            
            if (isAutumnLayer2) {
              // Autumn layer2 的配置（使用与 Spring layer2 第一部分相同的配置）
              imagePath = '/coast-layers/p5-assets/images/spring_layer2_1.png'
              // 三段文字内容
              textContent = [
                'Bioturbation is the natural mixing of sediments and\nporewaters by the burrowing, feeding, and movement of\nmarine organisms.',
                'This process is driven by diverse fauna—including\narthropods, annelids, and mollusks—living in self-built\nburrows and tubes within the sediment.',
                'Typical examples include:\n- Chironomid larvae in U-shaped tubes that\nactively pump water for ventilation.\n- Tubificid worms living head-down, feeding on\ndeep sediment.\n- Burrowing bivalves maintaining contact with the\noverlying water through their siphons.'
              ]
              textX = 0.12
              textY = 0.3
              paragraphSpacing = 0.07 // 段落间距
              showStaticText = false // 不显示静态文字
            } else if (isSpringLayer2Part1) {
              // Spring layer2 第一部分 的配置
              imagePath = '/coast-layers/p5-assets/images/spring_layer2_1.png'
              // 使用硬编码的文字内容，保持原有的显示格式
              textContent = [
                'Bioturbation is the natural mixing of sediments and\nporewaters by the burrowing, feeding, and movement of\nmarine organisms.',
                'This process is driven by diverse fauna—including\narthropods, annelids, and mollusks—living in self-built\nburrows and tubes within the sediment.',
                'Typical examples include:\n- Chironomid larvae in U-shaped tubes that\nactively pump water for ventilation.\n- Tubificid worms living head-down, feeding on\ndeep sediment.\n- Burrowing bivalves maintaining contact with the\noverlying water through their siphons.'
              ]
              textX = 0.12
              textY = 0.3
              paragraphSpacing = 0.07 // 段落间距
              showStaticText = false // 不显示静态文字
            } else if (isSpringLayer2Part2) {
              // Spring layer2 第二部分 的配置
              imagePath = '/coast-layers/p5-assets/images/spring_layer2_2.png'
              textContent = [
                'Plant roots shape the shallow subsurface of tidal flats by anchoring\nsediments and redistributing water, air, and nutrients.',
                'Through growth and decay, roots create networks of voids and channels that\nalter sediment structure and permeability.',
                'Mat-forming organisms such as mussels (M. senhousia) or algae\n(Caulerpa spp.) that blanket the sediment surface may have a reverse\neffect, homogenizing sediments by trapping fine particles and\npromoting dysaerobic or anaerobic conditions, or by limiting access to\nparticles for subsurface feeders below. as Bioturbation Index (as\n0 = low and 6 = reworked) or Ichnofabric Index (as 0 = low and\n6 = reworked,; both systems are supported with visual aids for the\nestimation of bioturbation intensity.'
              ]
              textX = 0.12
              textY = 0.3
              paragraphSpacing = 0.07 // 段落间距
              showStaticText = false // 不显示静态文字
            } else if (isSummerLayer2Part1) {
              // Summer layer2 第一部分 的配置（使用与 Spring layer2 第一部分相同的配置）
              imagePath = '/coast-layers/p5-assets/images/spring_layer2_1.png'
              // 三段文字内容
              textContent = [
                'Bioturbation is the natural mixing of sediments and\nporewaters by the burrowing, feeding, and movement of\nmarine organisms.',
                'This process is driven by diverse fauna—including\narthropods, annelids, and mollusks—living in self-built\nburrows and tubes within the sediment.',
                'Typical examples include:\n- Chironomid larvae in U-shaped tubes that\nactively pump water for ventilation.\n- Tubificid worms living head-down, feeding on\ndeep sediment.\n- Burrowing bivalves maintaining contact with the\noverlying water through their siphons.'
              ]
              textX = 0.12
              textY = 0.3
              paragraphSpacing = 0.07 // 段落间距
              showStaticText = false // 不显示静态文字
            } else if (isSummerLayer2Part2) {
              // Summer layer2 第二部分 的配置（使用与 Spring layer2 第二部分相同的配置）
              imagePath = '/coast-layers/p5-assets/images/spring_layer2_2.png'
              textContent = [
                'Plant roots shape the shallow subsurface of tidal flats by anchoring\nsediments and redistributing water, air, and nutrients.',
                'Through growth and decay, roots create networks of voids and channels that\nalter sediment structure and permeability.',
                'Mat-forming organisms such as mussels (M. senhousia) or algae\n(Caulerpa spp.) that blanket the sediment surface may have a reverse\neffect, homogenizing sediments by trapping fine particles and\npromoting dysaerobic or anaerobic conditions, or by limiting access to\nparticles for subsurface feeders below. as Bioturbation Index (as\n0 = low and 6 = reworked) or Ichnofabric Index (as 0 = low and\n6 = reworked,; both systems are supported with visual aids for the\nestimation of bioturbation intensity.'
              ]
              textX = 0.12
              textY = 0.3
              paragraphSpacing = 0.07 // 段落间距
              showStaticText = false // 不显示静态文字
            } else if (isWinterLayer2Part1) {
              // Winter layer2 第一部分 的配置（使用与 Spring layer2 第一部分相同的配置）
              imagePath = '/coast-layers/p5-assets/images/spring_layer2_1.png'
              // 三段文字内容
              textContent = [
                'Bioturbation is the natural mixing of sediments and\nporewaters by the burrowing, feeding, and movement of\nmarine organisms.',
                'This process is driven by diverse fauna—including\narthropods, annelids, and mollusks—living in self-built\nburrows and tubes within the sediment.',
                'Typical examples include:\n- Chironomid larvae in U-shaped tubes that\nactively pump water for ventilation.\n- Tubificid worms living head-down, feeding on\ndeep sediment.\n- Burrowing bivalves maintaining contact with the\noverlying water through their siphons.'
              ]
              textX = 0.12
              textY = 0.3
              paragraphSpacing = 0.07 // 段落间距
              showStaticText = false // 不显示静态文字
            } else if (isAutumnLayer2Part2) {
              // Autumn layer2 第二部分 的配置（使用与 Spring layer2 第二部分相同的配置）
              imagePath = '/coast-layers/p5-assets/images/spring_layer2_2.png'
              textContent = [
                'Plant roots shape the shallow subsurface of tidal flats by anchoring\nsediments and redistributing water, air, and nutrients.',
                'Through growth and decay, roots create networks of voids and channels that\nalter sediment structure and permeability.',
                'Mat-forming organisms such as mussels (M. senhousia) or algae\n(Caulerpa spp.) that blanket the sediment surface may have a reverse\neffect, homogenizing sediments by trapping fine particles and\npromoting dysaerobic or anaerobic conditions, or by limiting access to\nparticles for subsurface feeders below. as Bioturbation Index (as\n0 = low and 6 = reworked) or Ichnofabric Index (as 0 = low and\n6 = reworked,; both systems are supported with visual aids for the\nestimation of bioturbation intensity.'
              ]
              textX = 0.12
              textY = 0.3
              paragraphSpacing = 0.07 // 段落间距
              showStaticText = false // 不显示静态文字
            } else if (isWinterLayer2Part2) {
              // Winter layer2 第二部分 的配置（使用与 Spring layer2 第二部分相同的配置）
              imagePath = '/coast-layers/p5-assets/images/spring_layer2_2.png'
              textContent = [
                'Plant roots shape the shallow subsurface of tidal flats by anchoring\nsediments and redistributing water, air, and nutrients.',
                'Through growth and decay, roots create networks of voids and channels that\nalter sediment structure and permeability.',
                'Mat-forming organisms such as mussels (M. senhousia) or algae\n(Caulerpa spp.) that blanket the sediment surface may have a reverse\neffect, homogenizing sediments by trapping fine particles and\npromoting dysaerobic or anaerobic conditions, or by limiting access to\nparticles for subsurface feeders below. as Bioturbation Index (as\n0 = low and 6 = reworked) or Ichnofabric Index (as 0 = low and\n6 = reworked,; both systems are supported with visual aids for the\nestimation of bioturbation intensity.'
              ]
              textX = 0.12
              textY = 0.3
              paragraphSpacing = 0.07 // 段落间距
              showStaticText = false // 不显示静态文字
            }
            
            // 生成一个基于内容的 key，确保内容变化时组件重新创建
            const contentKey = Array.isArray(textContent) 
              ? textContent.join('|') 
              : (textContent || '')
            const uniqueKey = `p5-${season}-${layerIndex}-${texIndex}-${imagePath}-${contentKey.substring(0, 50)}`
            
            return (
              <div className="layer-detail-texture">
                <P5Sketch 
                  key={uniqueKey}
                  width={containerSize.width} 
                  height={containerSize.height} 
                  className="p5-fullscreen"
                  imagePath={imagePath}
                  textContent={textContent}
                  textX={textX}
                  textY={textY}
                  paragraphSpacing={paragraphSpacing}
                  showStaticText={showStaticText}
                />
              </div>
            )
          })()}
          
          {/* Spring layer3 texIndex=1 使用 P5TextCarving 效果 */}
          {(() => {
            const shouldShowP5TextCarving = season === 'spring' && layerIndex === 3 && texIndex === 1
            return shouldShowP5TextCarving
          })() ? (
            <div className="layer-detail-texture">
              <P5TextCarving 
                width={containerSize.width} 
                height={containerSize.height} 
                className="p5-fullscreen"
                posterImagePath="/coast-layers/p5-assets/images/autumn_layer3_1.png"
                text1Y={0.45}
                text2X={0.55}
              />
            </div>
          ) : null}
          
          {/* Spring layer3 texIndex=2 使用 P5TextCarving 效果（自定义文本和底图） */}
          {(() => {
            const shouldShowP5TextCarving = season === 'spring' && layerIndex === 3 && texIndex === 2
            return shouldShowP5TextCarving
          })() ? (
            <div className="layer-detail-texture" key={`spring-layer3-part2-${containerSize.width}-${containerSize.height}`}>
              <P5TextCarving 
                width={containerSize.width} 
                height={containerSize.height} 
                className="p5-fullscreen"
                posterImagePath="/coast-layers/p5-assets/images/spring_layer3_2.png"
                text1={`Tidal flats, also known as mudflats or 
idal mudflats, are gently sloping 
coastal zones that are primarily
composed of soft, fine sediments such 
as mud, silt, and sand. These regions 
are characterized by sparse vegetation 
cover and are frequently exposedto the 
air as the tide recedes. They are 
located between the lowest and highest 
astronomical tide marks, meaning they 
are submerged during high tide and 
exposed during low tide, which creates 
a dynamic and ever-changing
environment.`}
                text2={`Tidal flats often extend seaward
beyond the low tide line, where 
wave and tidal forces continue to
influence sediment movement. The 
sediment structure of tidal flats
can vary greatly, with some areas 
forming cohesive mudbanks that
behave similarly to cohesive clay 
or mud structures found in deeper
subtidal zones. These zones are 
essential for a variety of 
ecological processes, providing
crucial habitats for many marine 
species, including birds, fish, 
and invertebrates.`}
              />
            </div>
          ) : null}
          
          {/* Spring layer3 texIndex=3 使用 P5TextCarving 效果（自定义文本和底图） */}
          {(() => {
            const shouldShowP5TextCarving = season === 'spring' && layerIndex === 3 && texIndex === 3
            return shouldShowP5TextCarving
          })() ? (
            <div className="layer-detail-texture" key={`spring-layer3-part3-${containerSize.width}-${containerSize.height}`}>
              <P5TextCarving 
                width={containerSize.width} 
                height={containerSize.height} 
                className="p5-fullscreen"
                posterImagePath="/coast-layers/p5-assets/images/spring_layer3_3.png"
                text1={`Floodplains and estuaries form
interconnected landscapes where
riverine and marine processes
converge. Floodplains develop
alongside rivers through periodic
flooding, while estuaries emerge at
the interface where freshwater
meets the sea under tidal
influence. Together, they create
environments defined by fluctuating
water levels, shifting salinity,
and variable sediment supply, in
which land and water are
continuously reconfigured by flow.`}
                text2={`Within these systems, sediment deposition
and reworking occur unevenly across space
and time. Flood events spread fine materials
across floodplains, smoothing surfaces
through thin, episodic layers, while tidal
currents within estuaries redistribute these
sediments through channels, shoals, and
intertidal zones. Over longer timescales,
floodplain–estuary landscapes function as
transitional archives, recording changes in
discharge, tides, and sea level. Rather than
forming stable terrain, they remain adaptive
surfaces shaped by continual exchange
between freshwater and saltwater.`}
                text2X={0.65}
                text2Y={0.69}
              />
            </div>
          ) : null}
          
          {/* Summer layer3 texIndex=1 使用 P5TextCarving 效果 */}
          {(() => {
            const shouldShowP5TextCarving = season === 'summer' && layerIndex === 3 && texIndex === 1
            return shouldShowP5TextCarving
          })() ? (
            <div className="layer-detail-texture">
              <P5TextCarving 
                width={containerSize.width} 
                height={containerSize.height} 
                className="p5-fullscreen"
                posterImagePath="/coast-layers/p5-assets/images/autumn_layer3_1.png"
                text1Y={0.45}
                text2X={0.55}
              />
            </div>
          ) : null}
          
          {/* Autumn layer3 texIndex=1 使用 P5TextCarving 效果 */}
          {(() => {
            const shouldShowP5TextCarving = season === 'autumn' && layerIndex === 3 && texIndex === 1
            return shouldShowP5TextCarving
          })() ? (
            <div className="layer-detail-texture">
              <P5TextCarving 
                width={containerSize.width} 
                height={containerSize.height} 
                className="p5-fullscreen"
                posterImagePath="/coast-layers/p5-assets/images/autumn_layer3_1.png"
                text1Y={0.45}
                text2X={0.55}
              />
            </div>
          ) : null}
          
          {/* Winter layer3 texIndex=1 使用 P5TextCarving 效果 */}
          {(() => {
            const shouldShowP5TextCarving = season === 'winter' && layerIndex === 3 && texIndex === 1
            return shouldShowP5TextCarving
          })() ? (
            <div className="layer-detail-texture">
              <P5TextCarving 
                width={containerSize.width} 
                height={containerSize.height} 
                className="p5-fullscreen"
                posterImagePath="/coast-layers/p5-assets/images/autumn_layer3_1.png"
                text1Y={0.45}
                text2X={0.55}
              />
            </div>
          ) : null}
          
          {/* Summer layer3 texIndex=2 使用 P5TextCarving 效果（自定义文本和底图） */}
          {(() => {
            const shouldShowP5TextCarving = season === 'summer' && layerIndex === 3 && texIndex === 2
            return shouldShowP5TextCarving
          })() ? (
            <div className="layer-detail-texture">
              <P5TextCarving 
                width={containerSize.width} 
                height={containerSize.height} 
                className="p5-fullscreen"
                posterImagePath="/coast-layers/p5-assets/images/spring_layer3_2.png"
                text1={`Tidal flats, also known as mudflats or 
idal mudflats, are gently sloping 
coastal zones that are primarily
composed of soft, fine sediments such 
as mud, silt, and sand. These regions 
are characterized by sparse vegetation 
cover and are frequently exposedto the 
air as the tide recedes. They are 
located between the lowest and highest 
astronomical tide marks, meaning they 
are submerged during high tide and 
exposed during low tide, which creates 
a dynamic and ever-changing
environment.`}
                text2={`Tidal flats often extend seaward
beyond the low tide line, where 
wave and tidal forces continue to
influence sediment movement. The 
sediment structure of tidal flats
can vary greatly, with some areas 
forming cohesive mudbanks that
behave similarly to cohesive clay 
or mud structures found in deeper
subtidal zones. These zones are 
essential for a variety of 
ecological processes, providing
crucial habitats for many marine 
species, including birds, fish, 
and invertebrates.`}
              />
            </div>
          ) : null}
          
          {/* Autumn layer3 texIndex=2 使用 P5TextCarving 效果（自定义文本和底图） */}
          {(() => {
            const shouldShowP5TextCarving = season === 'autumn' && layerIndex === 3 && texIndex === 2
            return shouldShowP5TextCarving
          })() ? (
            <div className="layer-detail-texture">
              <P5TextCarving 
                width={containerSize.width} 
                height={containerSize.height} 
                className="p5-fullscreen"
                posterImagePath="/coast-layers/p5-assets/images/spring_layer3_2.png"
                text1={`Tidal flats, also known as mudflats or 
idal mudflats, are gently sloping 
coastal zones that are primarily
composed of soft, fine sediments such 
as mud, silt, and sand. These regions 
are characterized by sparse vegetation 
cover and are frequently exposedto the 
air as the tide recedes. They are 
located between the lowest and highest 
astronomical tide marks, meaning they 
are submerged during high tide and 
exposed during low tide, which creates 
a dynamic and ever-changing
environment.`}
                text2={`Tidal flats often extend seaward
beyond the low tide line, where 
wave and tidal forces continue to
influence sediment movement. The 
sediment structure of tidal flats
can vary greatly, with some areas 
forming cohesive mudbanks that
behave similarly to cohesive clay 
or mud structures found in deeper
subtidal zones. These zones are 
essential for a variety of 
ecological processes, providing
crucial habitats for many marine 
species, including birds, fish, 
and invertebrates.`}
              />
            </div>
          ) : null}
          
          {/* Winter layer3 texIndex=2 使用 P5TextCarving 效果（自定义文本和底图） */}
          {(() => {
            const shouldShowP5TextCarving = season === 'winter' && layerIndex === 3 && texIndex === 2
            return shouldShowP5TextCarving
          })() ? (
            <div className="layer-detail-texture">
              <P5TextCarving 
                width={containerSize.width} 
                height={containerSize.height} 
                className="p5-fullscreen"
                posterImagePath="/coast-layers/p5-assets/images/spring_layer3_2.png"
                text1={`Tidal flats, also known as mudflats or 
idal mudflats, are gently sloping 
coastal zones that are primarily
composed of soft, fine sediments such 
as mud, silt, and sand. These regions 
are characterized by sparse vegetation 
cover and are frequently exposedto the 
air as the tide recedes. They are 
located between the lowest and highest 
astronomical tide marks, meaning they 
are submerged during high tide and 
exposed during low tide, which creates 
a dynamic and ever-changing
environment.`}
                text2={`Tidal flats often extend seaward
beyond the low tide line, where 
wave and tidal forces continue to
influence sediment movement. The 
sediment structure of tidal flats
can vary greatly, with some areas 
forming cohesive mudbanks that
behave similarly to cohesive clay 
or mud structures found in deeper
subtidal zones. These zones are 
essential for a variety of 
ecological processes, providing
crucial habitats for many marine 
species, including birds, fish, 
and invertebrates.`}
              />
            </div>
          ) : null}
          
          {/* 其他情况显示普通 Texture 图片 */}
          {(() => {
            const shouldShowP5WaveText = (season === 'spring' && layerIndex === 1 && texIndex === 1) ||
                                        (season === 'spring' && layerIndex === 1 && texIndex === 2) ||
                                        (season === 'summer' && layerIndex === 1 && texIndex === 1) ||
                                        (season === 'summer' && layerIndex === 1 && texIndex === 2) ||
                                        (season === 'summer' && layerIndex === 1 && texIndex === 3) ||
                                        (season === 'autumn' && layerIndex === 1 && texIndex === 1) ||
                                        (season === 'autumn' && layerIndex === 1 && texIndex === 2) ||
                                        (season === 'winter' && layerIndex === 1 && texIndex === 1)
            const shouldShowP5Sketch = season === 'autumn' && layerIndex === 2
            const shouldShowP5SketchSpring2Part1 = season === 'spring' && layerIndex === 2 && texIndex === 1
            const shouldShowP5SketchSpring2Part2 = season === 'spring' && layerIndex === 2 && texIndex === 2
            const shouldShowP5SketchSummer2Part1 = season === 'summer' && layerIndex === 2 && texIndex === 1
            const shouldShowP5SketchSummer2Part2 = season === 'summer' && layerIndex === 2 && texIndex === 2
            const shouldShowP5SketchAutumn2Part2 = season === 'autumn' && layerIndex === 2 && texIndex === 2
            const shouldShowP5SketchWinter2Part1 = season === 'winter' && layerIndex === 2 && texIndex === 1
            const shouldShowP5SketchWinter2Part2 = season === 'winter' && layerIndex === 2 && texIndex === 2
            const shouldShowP5TextCarvingSpring1 = season === 'spring' && layerIndex === 3 && texIndex === 1
            const shouldShowP5TextCarvingSpring2 = season === 'spring' && layerIndex === 3 && texIndex === 2
            const shouldShowP5TextCarvingSpring3 = season === 'spring' && layerIndex === 3 && texIndex === 3
            const shouldShowP5TextCarvingSummer1 = season === 'summer' && layerIndex === 3 && texIndex === 1
            const shouldShowP5TextCarvingSummer2 = season === 'summer' && layerIndex === 3 && texIndex === 2
            const shouldShowP5TextCarvingAutumn1 = season === 'autumn' && layerIndex === 3 && texIndex === 1
            const shouldShowP5TextCarvingAutumn2 = season === 'autumn' && layerIndex === 3 && texIndex === 2
            const shouldShowP5TextCarvingWinter1 = season === 'winter' && layerIndex === 3 && texIndex === 1
            const shouldShowP5TextCarvingWinter2 = season === 'winter' && layerIndex === 3 && texIndex === 2
            return !shouldShowP5WaveText && !shouldShowP5Sketch && !shouldShowP5SketchSpring2Part1 && !shouldShowP5SketchSpring2Part2 && !shouldShowP5SketchSummer2Part1 && !shouldShowP5SketchSummer2Part2 && !shouldShowP5SketchAutumn2Part2 && !shouldShowP5SketchWinter2Part1 && !shouldShowP5SketchWinter2Part2 && !shouldShowP5TextCarvingSpring1 && !shouldShowP5TextCarvingSpring2 && !shouldShowP5TextCarvingSpring3 && !shouldShowP5TextCarvingSummer1 && !shouldShowP5TextCarvingSummer2 && !shouldShowP5TextCarvingAutumn1 && !shouldShowP5TextCarvingAutumn2 && !shouldShowP5TextCarvingWinter1 && !shouldShowP5TextCarvingWinter2
          })() ? (
          <div 
            className="layer-detail-texture"
            style={{
              backgroundImage: textureBase !== 'default' ? `url('${texturePath}')` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          ) : null}

          {/* Description 文字 - Flood 动画 - Overlay在texture上方 */}
          {layerData && layerData.animationType === 'flood' && !isSpringLayer1Part1 && !isSpringLayer1Part2 && !isSummerLayer1Part1 && !isSummerLayer1Part2 && !isSummerLayer1Part3 && !isAutumnLayer1Part1 && !isAutumnLayer1Part2 && !isWinterLayer1Part1 && (
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
          {layerData && layerData.animationType !== 'flood' && !isSpringLayer1Part1 && !isSpringLayer1Part2 && !isSummerLayer1Part1 && !isSummerLayer1Part2 && !isSummerLayer1Part3 && !isAutumnLayer1Part1 && !isAutumnLayer1Part2 && !isWinterLayer1Part1 && !isAutumnLayer2 && !isSpringLayer2Part1 && !isSpringLayer2Part2 && !isSummerLayer2Part1 && !isSummerLayer2Part2 && !isAutumnLayer2Part2 && !isWinterLayer2Part1 && !isWinterLayer2Part2 && (
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

