import { useEffect, useRef } from 'react'
import p5 from 'p5'

interface P5TextCarvingProps {
  width?: number
  height?: number
  className?: string
  posterImagePath?: string
  fontPath?: string
  text1?: string
  text2?: string
  text1X?: number // 文段1的X位置（相对于画布宽度的比例，0-1）
  text1Y?: number // 文段1的Y位置（相对于画布高度的比例，0-1）
  text2X?: number // 文段2的X位置（相对于画布宽度的比例，0-1）
  text2Y?: number // 文段2的Y位置（相对于画布高度的比例，0-1）
}

interface LetterInkBleedState {
  triggered: boolean
  progress: number
  triggerTime: number
}

interface TextConfig {
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: [number, number, number]
  textAlign: 'left' | 'center' | 'right'
  startTime: number
  fadeInDuration: number
  carvingDuration: number
}

export default function P5TextCarving({ 
  width = 1920, 
  height = 1080,
  className = '',
  posterImagePath = '/coast-layers/p5-assets/images/autumn_layer3_1.png',
  fontPath = '/coast-layers/p5-assets/fonts/LetterGothicStd-Bold.otf',
  text1,
  text2,
  text1X,
  text1Y,
  text2X,
  text2Y
}: P5TextCarvingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<p5 | null>(null)

  function initializeP5() {
    if (!containerRef.current) {
      console.error('P5TextCarving: initializeP5 被调用但容器为空')
      return
    }
    
    if (p5InstanceRef.current) {
      console.log('P5TextCarving: 清理旧的 p5 实例')
      // 清理 canvas 元素
      const canvas = containerRef.current?.querySelector('canvas')
      if (canvas) {
        canvas.remove()
      }
      p5InstanceRef.current.remove()
      p5InstanceRef.current = null
    }
    
    console.log('P5TextCarving: 开始初始化', { width, height, text1, text2, container: containerRef.current })

    // 在 sketch 函数外部定义文本，确保使用最新的值
    const defaultText1 = "Acidic water erosion\noccurs in environments\nwhere water with\nlowered pH interacts\npersistently with\nexposed mineral\nsurfaces.\nIt is not a sudden or\nviolent process, but a\nslow and continuous\nform of material\ntransformation, often\nacting along\nfractures, pores, and\ngrain boundaries."
    const defaultText2 = "In many cases, acidic\nwater penetrates beyond\nthe visible surface,\nextending its influence\ninto subsurface layers.\nSimilar dissolution-\ndriven processes continue\nbeneath the ground, where\nminerals are gradually\nweakened, mobilized, or\nreprecipitated, allowing\nerosion to function not\nonly as removal, but also\nas a quiet reorganization\nof matter."
    
    // 只有当 text1/text2 明确传入且不为空时才使用，否则使用默认值
    const finalText1 = (text1 !== undefined && text1 !== null && text1 !== '') ? text1 : defaultText1
    const finalText2 = (text2 !== undefined && text2 !== null && text2 !== '') ? text2 : defaultText2
    
    console.log('P5TextCarving: 文本内容', { 
      hasText1: !!text1, 
      hasText2: !!text2,
      finalText1Length: finalText1.length,
      finalText2Length: finalText2.length,
      finalText1Preview: finalText1.substring(0, 50),
      finalText2Preview: finalText2.substring(0, 50)
    })

    const sketch = (p: p5) => {
      let posterImage: p5.Image | null = null
      let customFont: p5.Font | null = null

      // 在 sketch 函数内部重新计算文本，确保使用最新的值
      const sketchDefaultText1 = "Acidic water erosion\noccurs in environments\nwhere water with\nlowered pH interacts\npersistently with\nexposed mineral\nsurfaces.\nIt is not a sudden or\nviolent process, but a\nslow and continuous\nform of material\ntransformation, often\nacting along\nfractures, pores, and\ngrain boundaries."
      const sketchDefaultText2 = "In many cases, acidic\nwater penetrates beyond\nthe visible surface,\nextending its influence\ninto subsurface layers.\nSimilar dissolution-\ndriven processes continue\nbeneath the ground, where\nminerals are gradually\nweakened, mobilized, or\nreprecipitated, allowing\nerosion to function not\nonly as removal, but also\nas a quiet reorganization\nof matter."
      
      const sketchFinalText1 = (text1 !== undefined && text1 !== null && text1 !== '') ? text1 : sketchDefaultText1
      const sketchFinalText2 = (text2 !== undefined && text2 !== null && text2 !== '') ? text2 : sketchDefaultText2

      // 文字位置和样式配置
      const textConfig: { text1: TextConfig; text2: TextConfig } = {
        text1: {
          x: 0,
          y: 0,
          fontSize: 40,
          fontFamily: 'Arial, sans-serif',
          color: [0, 0, 0],
          textAlign: 'left',
          startTime: 0,
          fadeInDuration: 5.0,
          carvingDuration: 5.0
        },
        text2: {
          x: 0,
          y: 0,
          fontSize: 40,
          fontFamily: 'Arial, sans-serif',
          color: [0, 0, 0],
          textAlign: 'right',
          startTime: 3,
          fadeInDuration: 5.0,
          carvingDuration: 5.0
        }
      }

      let startTime: number
      let imageLoaded = false
      let imageLoadError = false
      let canvasWidth = width > 0 ? width : 1920
      let canvasHeight = height > 0 ? height : 1080
      let imageAspectRatio = 16 / 9
      let scaleFactor = 1

      // 存储每个字母的墨水洇出状态
      const letterInkBleedStates: {
        text1: Record<string, LetterInkBleedState>
        text2: Record<string, LetterInkBleedState>
      } = {
        text1: {},
        text2: {}
      }
      const inkBleedHoldDuration = 5.0

      p.preload = () => {
        // 加载自定义字体
        try {
          customFont = p.loadFont(
            fontPath,
            () => {
              console.log('✓ 字体加载成功')
            },
            () => {
              console.warn('⚠ 字体加载失败，将使用默认字体')
            }
          )
        } catch (e) {
          console.warn('⚠ 字体加载出错', e)
          customFont = null
        }
        
        // 加载海报图片
        try {
          posterImage = p.loadImage(
            posterImagePath,
            () => {
              imageLoaded = true
              imageLoadError = false
              console.log('✓ 图片加载成功')
              if (posterImage && posterImage.width > 0 && posterImage.height > 0) {
                imageAspectRatio = posterImage.width / posterImage.height
                console.log('图片尺寸:', posterImage.width, 'x', posterImage.height, '宽高比:', imageAspectRatio)
              }
            },
            () => {
              imageLoadError = true
              console.warn('⚠ 图片加载失败，将使用默认背景')
            }
          )
        } catch (e) {
          imageLoadError = true
          console.error('图片加载出错:', e)
        }
      }

      p.setup = () => {
        if (posterImage && imageLoaded) {
          imageAspectRatio = posterImage.width / posterImage.height
        }
        
        // 使用传入的容器尺寸，而不是窗口尺寸
        const containerWidth = width > 0 ? width : p.windowWidth
        const containerHeight = height > 0 ? height : p.windowHeight
        
        // 计算画布尺寸，使其完全填充容器
        canvasWidth = containerWidth
        canvasHeight = containerHeight
        
        // 计算缩放因子
        if (imageLoaded && posterImage) {
          scaleFactor = canvasWidth / posterImage.width
        } else {
          scaleFactor = canvasWidth / 1920
        }
        
        // 更新文字大小
        textConfig.text1.fontSize = 40 * scaleFactor
        textConfig.text2.fontSize = 40 * scaleFactor
        
        p.createCanvas(canvasWidth, canvasHeight)
        
        console.log('画布尺寸:', canvasWidth, 'x', canvasHeight)
        console.log('容器尺寸:', containerWidth, 'x', containerHeight)
        console.log('图片宽高比:', imageAspectRatio)
        console.log('缩放因子:', scaleFactor)
        
        startTime = p.millis() / 1000.0
        updateTextPositions()
      }

      function updateTextPositions() {
        // 第一段文字位置
        if (text1X !== undefined) {
          // 如果传入了自定义X位置，直接使用
          textConfig.text1.x = canvasWidth * text1X
        } else {
          // 否则根据对齐方式计算
          if (textConfig.text1.textAlign === 'left') {
            textConfig.text1.x = canvasWidth * 0.12
          } else if (textConfig.text1.textAlign === 'right') {
            textConfig.text1.x = canvasWidth * 0.9
          } else {
            textConfig.text1.x = canvasWidth * 0.5
          }
        }
        textConfig.text1.y = canvasHeight * (text1Y !== undefined ? text1Y : 0.4)
        
        // 第二段文字位置
        if (text2X !== undefined) {
          // 如果传入了自定义X位置，直接使用
          textConfig.text2.x = canvasWidth * text2X
        } else {
          // 否则根据对齐方式计算
          if (textConfig.text2.textAlign === 'left') {
            textConfig.text2.x = canvasWidth * 0.1
          } else if (textConfig.text2.textAlign === 'right') {
            textConfig.text2.x = canvasWidth * 0.6
          } else {
            textConfig.text2.x = canvasWidth * 0.5
          }
        }
        textConfig.text2.y = canvasHeight * (text2Y !== undefined ? text2Y : 0.72)
      }

      p.windowResized = () => {
        // 使用传入的容器尺寸
        const containerWidth = width > 0 ? width : p.windowWidth
        const containerHeight = height > 0 ? height : p.windowHeight
        
        canvasWidth = containerWidth
        canvasHeight = containerHeight
        
        // 重新计算缩放因子
        if (imageLoaded && posterImage) {
          scaleFactor = canvasWidth / posterImage.width
        } else {
          scaleFactor = canvasWidth / 1920
        }
        
        textConfig.text1.fontSize = 40 * scaleFactor
        textConfig.text2.fontSize = 40 * scaleFactor
        
        p.resizeCanvas(canvasWidth, canvasHeight)
        updateTextPositions()
        console.log('画布大小已调整:', canvasWidth, 'x', canvasHeight)
      }

      p.draw = () => {
        if (imageLoadError || !imageLoaded) {
          drawDefaultBackground()
          
          if (imageLoadError) {
            p.fill(255, 200, 0)
            p.textAlign(p.CENTER, p.CENTER)
            p.textSize(20)
            p.text('提示：未找到图片文件', p.width / 2, p.height - 50)
          } else {
            p.fill(200)
            p.textAlign(p.CENTER, p.CENTER)
            p.textSize(20)
            p.text('正在加载图片...', p.width / 2, p.height - 30)
          }
        } else {
          // 绘制底图（完全显示，类似 contain：图片完整显示，保持宽高比，可能有空白）
          const canvasWidth = width > 0 ? width : p.width
          const canvasHeight = height > 0 ? height : p.height
          
          // 计算缩放比例，使图片完全显示在 canvas 内（类似 CSS background-size: contain）
          const imageAspect = posterImage!.width / posterImage!.height
          const canvasAspect = canvasWidth / canvasHeight
          
          let drawWidth, drawHeight, drawX, drawY
          
          if (imageAspect > canvasAspect) {
            // 图片更宽，以宽度为准，确保图片完全显示
            drawWidth = canvasWidth
            drawHeight = drawWidth / imageAspect
            drawX = 0
            drawY = (canvasHeight - drawHeight) / 2
          } else {
            // 图片更高，以高度为准，确保图片完全显示
            drawHeight = canvasHeight
            drawWidth = drawHeight * imageAspect
            drawX = (canvasWidth - drawWidth) / 2
            drawY = 0
          }
          
          p.image(posterImage!, drawX, drawY, drawWidth, drawHeight)
        }
        
        const currentTime = (p.millis() / 1000.0) - startTime
        
        if (currentTime > 1) {
          const fadeAmount = p.map(p.constrain(currentTime, 1, 10), 1, 10, 0, 0.1)
          p.fill(0, 0, 0, fadeAmount * 255)
          p.rect(0, 0, p.width, p.height)
        }
        
        if (sketchFinalText1 && sketchFinalText1.length > 0) {
          drawTextWithCarvingEffect(sketchFinalText1, textConfig.text1, currentTime, 'text1')
        }
        
        if (sketchFinalText2 && sketchFinalText2.length > 0) {
          drawTextWithCarvingEffect(sketchFinalText2, textConfig.text2, currentTime, 'text2')
        }
      }

      function drawDefaultBackground() {
        for (let i = 0; i <= p.height; i++) {
          const inter = p.map(i, 0, p.height, 0, 1)
          const c = p.lerpColor(p.color(60, 50, 40), p.color(40, 35, 30), inter)
          p.stroke(c)
          p.line(0, i, p.width, i)
        }
        
        p.noStroke()
        for (let i = 0; i < 100; i++) {
          p.fill(p.random(30, 50), p.random(25, 40), p.random(20, 35), 30)
          p.ellipse(p.random(p.width), p.random(p.height), p.random(50, 200))
        }
      }

      function drawTextWithCarvingEffect(text: string, config: TextConfig, currentTime: number, textId: 'text1' | 'text2') {
        const elapsed = currentTime - config.startTime
        
        if (elapsed < 0) return
        
        p.push()
        
        if (config.textAlign === 'left') {
          p.textAlign(p.LEFT, p.CENTER)
        } else if (config.textAlign === 'right') {
          p.textAlign(p.RIGHT, p.CENTER)
        } else {
          p.textAlign(p.CENTER, p.CENTER)
        }
        
        if (customFont) {
          p.textFont(customFont)
        } else {
          p.textFont(config.fontFamily)
        }
        p.textSize(config.fontSize)
        
        let fadeInProgress = 0
        if (elapsed < config.fadeInDuration) {
          fadeInProgress = elapsed / config.fadeInDuration
        } else {
          fadeInProgress = 1
        }
        
        let carvingProgress = 0
        const carvingStartTime = config.fadeInDuration
        if (elapsed > carvingStartTime) {
          const carvingElapsed = elapsed - carvingStartTime
          carvingProgress = p.constrain(carvingElapsed / config.carvingDuration, 0, 1)
        }
        
        const currentAlpha = fadeInProgress * 255
        const currentDepth = carvingProgress
        
        drawTextWithFadeAndCarving(text, config.x, config.y, config, currentAlpha, currentDepth, textId, currentTime)
        
        p.pop()
      }

      function drawTextWithFadeAndCarving(
        textString: string,
        x: number,
        y: number,
        config: TextConfig,
        alpha: number,
        _carvingDepth: number,
        textId: 'text1' | 'text2',
        currentTime: number
      ) {
        if (alpha <= 0) return
        
        let lines = textString.split('\n').map(line => line.trim()).filter(line => line.length > 0)
        if (lines.length === 0) return
        
        const lineHeight = config.fontSize * 1.2
        const totalHeight = (lines.length - 1) * lineHeight
        const startY = y - totalHeight / 2
        
        drawTextWithLetterInkBleed(lines, x, startY, lineHeight, config, alpha, textId, currentTime)
      }

      function drawTextWithLetterInkBleed(
        lines: string[],
        x: number,
        startY: number,
        lineHeight: number,
        config: TextConfig,
        alpha: number,
        textId: 'text1' | 'text2',
        currentTime: number
      ) {
        if (config.textAlign === 'left') {
          p.textAlign(p.LEFT, p.CENTER)
        } else if (config.textAlign === 'right') {
          p.textAlign(p.RIGHT, p.CENTER)
        } else {
          p.textAlign(p.CENTER, p.CENTER)
        }
        
        if (customFont) {
          p.textFont(customFont)
        } else {
          p.textFont(config.fontFamily)
        }
        
        const states = letterInkBleedStates[textId]
        
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          if (lines[lineIdx].length === 0) continue
          
          const lineText = lines[lineIdx]
          const lineY = startY + lineIdx * lineHeight
          
          p.textSize(config.fontSize)
          const lineWidth = p.textWidth(lineText)
          const lineX = config.textAlign === 'left' ? x : 
                        config.textAlign === 'right' ? x - lineWidth : 
                        x - lineWidth / 2
          
          let currentX = lineX
          for (let charIdx = 0; charIdx < lineText.length; charIdx++) {
            const char = lineText[charIdx]
            const charKey = `${lineIdx}_${charIdx}`
            const charWidth = p.textWidth(char)
            const charCenterX = currentX + charWidth / 2
            
            const mouseInLetter = (p.mouseX >= currentX - 5 && p.mouseX <= currentX + charWidth + 5 &&
                                  p.mouseY >= lineY - config.fontSize * 0.6 && 
                                  p.mouseY <= lineY + config.fontSize * 0.6)
            
            if (!states[charKey]) {
              states[charKey] = { triggered: false, progress: 0, triggerTime: 0 }
            }
            
            if (mouseInLetter && !states[charKey].triggered) {
              states[charKey].triggered = true
              states[charKey].triggerTime = currentTime
            }
            
            const timeSinceTrigger = currentTime - states[charKey].triggerTime
            if (states[charKey].triggered && timeSinceTrigger > inkBleedHoldDuration) {
              const fadeOutProgress = (timeSinceTrigger - inkBleedHoldDuration) / 4.0
              if (fadeOutProgress >= 1) {
                states[charKey].triggered = false
                states[charKey].progress = 0
                states[charKey].triggerTime = 0
              } else {
                states[charKey].progress = p.max(0, states[charKey].progress * (1 - fadeOutProgress))
              }
            } else if (states[charKey].triggered) {
              states[charKey].progress = p.min(states[charKey].progress + 0.02, 1)
            }
            
            const bleedProgress = states[charKey].progress
            
            p.push()
            p.fill(config.color[0], config.color[1], config.color[2], alpha)
            p.noStroke()
            p.textSize(config.fontSize)
            p.textAlign(p.CENTER, p.CENTER)
            if (customFont) {
              p.textFont(customFont)
            } else {
              p.textFont(config.fontFamily)
            }
            
            p.text(char, charCenterX, lineY)
            
            if (bleedProgress > 0) {
              drawLetterInkBleed(char, charCenterX, lineY, config, alpha, bleedProgress)
            }
            p.pop()
            
            currentX += charWidth
          }
        }
      }

      function drawLetterInkBleed(
        char: string,
        x: number,
        y: number,
        config: TextConfig,
        alpha: number,
        progress: number
      ) {
        p.push()
        
        p.blendMode(p.MULTIPLY)
        
        const baseSize = config.fontSize
        const bleedSize = baseSize * (1 + progress * 0.7)
        const blurLayers = 12
        
        p.textAlign(p.CENTER, p.CENTER)
        if (customFont) {
          p.textFont(customFont)
        } else {
          p.textFont(config.fontFamily)
        }
        
        let charCode = 0
        for (let i = 0; i < char.length; i++) {
          charCode += char.charCodeAt(i)
        }
        p.randomSeed(charCode * 123)
        
        for (let i = blurLayers; i >= 0; i--) {
          const layerProgress = i / blurLayers
          const layerSize = p.lerp(bleedSize, baseSize * 0.95, layerProgress)
          const layerAlpha = alpha * progress * (0.3 + layerProgress * 0.9)
          const spreadAmount = (bleedSize - baseSize) * layerProgress * 0.35
          
          p.fill(0, 0, 0, layerAlpha)
          p.noStroke()
          p.textSize(layerSize)
          
          const offsetX = x + spreadAmount * (p.random(-0.6, 0.6) * (0.4 + progress * 0.4))
          const offsetY = y + spreadAmount * (p.random(-0.5, 0.5) * (0.4 + progress * 0.4))
          
          p.text(char, offsetX, offsetY)
        }
        
        if (progress > 0.3) {
          const dripCount = p.floor(progress * 2)
          for (let i = 0; i < dripCount; i++) {
            const dripX = x + p.random(-baseSize * 0.25, baseSize * 0.25)
            const dripStartY = y + baseSize * 0.35
            const dripY = dripStartY + p.random(0, baseSize * 0.3 * progress)
            const dripWidth = p.random(1, 2.5)
            const dripHeight = p.random(2, 6) * progress
            
            p.fill(0, 0, 0, alpha * 0.8 * progress)
            p.ellipse(dripX, dripY, dripWidth, dripHeight)
          }
        }
        
        if (progress > 0.4) {
          const sideBleedCount = p.floor(progress * 1.5)
          for (let i = 0; i < sideBleedCount; i++) {
            const sideOffset = p.random() < 0.5 ? -1 : 1
            const bleedX = x + sideOffset * baseSize * 0.4 + p.random(-1, 1)
            const bleedY = y + p.random(-baseSize * 0.2, baseSize * 0.2)
            const bleedSize_ = p.random(1.5, 3) * progress
            
            p.fill(0, 0, 0, alpha * 0.6 * progress)
            p.ellipse(bleedX, bleedY, bleedSize_, bleedSize_ * p.random(0.9, 1.1))
          }
        }
        
        p.pop()
      }

      p.mousePressed = () => {
        startTime = p.millis() / 1000.0
      }
    }

    if (containerRef.current) {
      const container = containerRef.current
      container.style.display = 'block'
      container.style.width = '100%'
      container.style.height = '100%'
    }
    
    try {
      if (!containerRef.current?.isConnected) {
        console.error('P5TextCarving: 容器未连接到 DOM！')
        return
      }
      
      p5InstanceRef.current = new p5(sketch, containerRef.current)
      console.log('P5TextCarving: p5 实例已创建')
    } catch (error) {
      console.error('P5TextCarving: 创建 p5 实例时出错', error)
    }
  }

  const setContainerRef = (el: HTMLDivElement | null) => {
    containerRef.current = el
    // 移除这里的自动初始化，让 useEffect 统一管理
  }

  useEffect(() => {
    if (containerRef.current) {
      initializeP5()
    } else {
      let retryCount = 0
      const checkContainer = () => {
        retryCount++
        if (containerRef.current) {
          initializeP5()
        } else if (retryCount < 10) {
          setTimeout(checkContainer, 100)
        }
      }
      setTimeout(checkContainer, 100)
    }

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove()
        p5InstanceRef.current = null
      }
    }
  }, [width, height, posterImagePath, fontPath, text1, text2])

  return (
    <div 
      ref={setContainerRef}
      className={className}
      style={{ 
        display: 'block',
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    />
  )
}


