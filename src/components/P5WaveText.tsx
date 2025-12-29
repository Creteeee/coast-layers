import { useEffect, useRef } from 'react'
import p5 from 'p5'

interface TextItem {
  text: string
  x: number
  y: number
}

interface P5WaveTextProps {
  width?: number
  height?: number
  className?: string
  imagePath?: string // 自定义底图路径
  texts?: TextItem[] // 自定义文字配置
  fontSize?: number // 字体大小
  fontColor?: [number, number, number] // RGB颜色
  fontPath?: string // 字体路径
  waveAmplitude?: number // 波动幅度
  letterWaveAmplitude?: number // 字母波浪浮动幅度
  letterWaveSpeed?: number // 字母波浪速度
  waveSpeed?: number // 波动速度
  waveFrequency?: number // 波动频率
  hoverKeepDuration?: number // 鼠标离开后保持时间（毫秒）
  hoverFadeDuration?: number // 淡出过程持续时间（毫秒）
}

export default function P5WaveText({
  width = 800,
  height = 600,
  className = '',
  imagePath = '/coast-layers/p5-assets/images/spring_layer1_1.png',
  texts,
  fontSize = 16,
  fontColor = [0, 0, 0],
  fontPath = '/coast-layers/p5-assets/fonts/LetterGothicStd-Bold.otf',
  waveAmplitude = 30,
  letterWaveAmplitude = 8,
  letterWaveSpeed = 0.1,
  waveSpeed = 0.02,
  waveFrequency = 1,
  hoverKeepDuration = 3000,
  hoverFadeDuration = 2000
}: P5WaveTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<p5 | null>(null)

  // 默认文字配置
  const defaultTexts: TextItem[] = [
    {
      text: "The first layer is the mineral framework",
      x: 100,
      y: 220
    },
    {
      text: "feldspar (KAlSi₃O₈, NaAlSi₃O₈, CaAl₂Si₂O₈)",
      x: 800,
      y: 280
    },
    {
      text: "clay minerals (montmorillonite, etc.).",
      x: 480,
      y: 350
    },
    {
      text: "The second layer is secondary coatings",
      x: 280,
      y: 420
    },
    {
      text: "iron oxides (Fe₂O₃ / FeOOH)",
      x: 420,
      y: 490
    },
    {
      text: "The determinants of this layer include color (yellow, brown, red)",
      x: 650,
      y: 560
    },
    {
      text: "carbonate minerals (calcite)",
      x: 120,
      y: 610
    },
    {
      text: "cementation, redox reactions, and spectral characteristics.",
      x: 600,
      y: 680
    }
  ]

  const hoverTotalDuration = hoverKeepDuration + hoverFadeDuration

  function initializeP5() {
    if (!containerRef.current) {
      console.error('P5WaveText: initializeP5 被调用但容器为空')
      return
    }

    // 如果已经存在 p5 实例，先清理
    if (p5InstanceRef.current) {
      console.log('P5WaveText: 清理旧的 p5 实例')
      p5InstanceRef.current.remove()
      p5InstanceRef.current = null
    }

    const sketch = (p: p5) => {
      // 在 sketch 函数内部使用最新的 texts，避免闭包问题
      const currentTexts = texts || defaultTexts
      
      let backgroundImage: p5.Image | null = null
      let customFont: p5.Font | null = null
      let time = 0
      const hoverTimes = new Map<number, number>()

      // Unicode下标字符映射表
      const subscriptMap: { [key: string]: string } = {
        '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
        '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'
      }

      // 绘制带下标的文本（支持换行）
      function drawTextWithSubscript(
        str: string,
        x: number,
        y: number,
        enableLetterWave: boolean = false,
        waveIntensity: number = 1
      ) {
        let currentX = x
        let currentY = y
        const baseFontSize = fontSize
        const subscriptFontSize = baseFontSize * 0.65
        const subscriptOffset = baseFontSize * 0.25
        const lineHeight = baseFontSize * 1.4 // 行高

        // 确保使用自定义字体
        if (customFont) {
          p.textFont(customFont)
        }

        let charIndex = 0 // 用于计算字母波浪效果的索引
        for (let i = 0; i < str.length; i++) {
          const char = str[i]
          
          // 处理换行符
          if (char === '\n') {
            currentX = x // 重置到起始 x 位置
            currentY += lineHeight // 移动到下一行
            charIndex = 0 // 重置字符索引（用于波浪效果）
            continue
          }
          
          const isSubscript = subscriptMap.hasOwnProperty(char)

          // 计算字母的波浪偏移（如果启用）
          let letterWaveOffset = 0
          if (enableLetterWave && !isSubscript) {
            const letterPhase = charIndex * 0.5
            letterWaveOffset =
              p.sin(time * letterWaveSpeed + letterPhase) *
              letterWaveAmplitude *
              waveIntensity
          }

          if (isSubscript) {
            // 绘制下标
            p.textSize(subscriptFontSize)
            const subscriptChar = subscriptMap[char]
            p.text(subscriptChar, currentX, currentY + subscriptOffset)
            currentX += p.textWidth(subscriptChar)
          } else {
            // 绘制正常字符（加上字母波浪偏移）
            p.textSize(baseFontSize)
            p.text(char, currentX, currentY + letterWaveOffset)
            currentX += p.textWidth(char)
          }
          
          charIndex++ // 增加字符索引
        }

        // 恢复字体大小
        p.textSize(baseFontSize)
      }

      p.preload = () => {
        // 加载底图
        try {
          backgroundImage = p.loadImage(imagePath)
        } catch (e) {
          console.error('P5WaveText: 图片加载失败', e)
          backgroundImage = null
        }

        // 加载自定义字体
        try {
          customFont = p.loadFont(fontPath)
        } catch (e) {
          console.warn('P5WaveText: 字体加载失败，使用默认字体', e)
          customFont = null
        }
      }

      p.setup = () => {
        let canvasWidth = width > 0 ? width : p.windowWidth
        let canvasHeight = height > 0 ? height : p.windowHeight

        // 如果容器存在，尝试从容器获取尺寸
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect()
          if (containerRect.width > 0) canvasWidth = containerRect.width
          if (containerRect.height > 0) canvasHeight = containerRect.height
        }

        p.createCanvas(canvasWidth, canvasHeight)

        // 使用自定义字体（如果已加载）
        if (customFont) {
          p.textFont(customFont)
        }
        p.textSize(fontSize)
        p.textAlign(p.LEFT, p.CENTER)
      }

      p.draw = () => {
        // 绘制底图（完全显示，类似 contain：图片完整显示，保持宽高比，可能有空白）
        // 检查图片是否已加载（p5.js 图片加载是异步的）
        if (backgroundImage && backgroundImage.width > 0 && backgroundImage.height > 0) {
          const canvasWidth = width > 0 ? width : p.width
          const canvasHeight = height > 0 ? height : p.height
          
          // 计算缩放比例，使图片完全显示在 canvas 内（类似 CSS background-size: contain）
          const imageAspect = backgroundImage.width / backgroundImage.height
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
          
          p.image(backgroundImage, drawX, drawY, drawWidth, drawHeight)
        } else {
          // 如果图片未加载，设置背景色而不是清空
          p.background(20, 30, 50) // 深色背景
        }

        // 更新时间
        time += waveSpeed

        // 使用自定义字体（如果已加载）
        if (customFont) {
          try {
            p.textFont(customFont)
          } catch (e) {
            // 如果字体使用失败，继续使用默认字体
          }
        }

        // 绘制每句文字
        currentTexts.forEach((textItem, index) => {
          // 计算每句文字的y位置（添加波浪效果）
          const phase = index * (p.TWO_PI / currentTexts.length)

          // 计算文字宽度和高度（用于检测鼠标悬停）
          // 对于多行文本，需要计算总高度
          p.textSize(fontSize)
          const lines = textItem.text.split('\n')
          const lineHeight = fontSize * 1.4
          const textH = lines.length * lineHeight // 多行文本的总高度
          const textW = Math.max(...lines.map(line => p.textWidth(line))) // 最宽行的宽度

          // 先计算基础位置（不带波动），用于检测鼠标悬停
          const baseX = textItem.x
          const baseY = textItem.y

          // 计算整个句子的波动偏移
          const waveOffset =
            p.sin(time * waveFrequency + phase) * waveAmplitude

          // 检测鼠标是否在文字区域内（考虑波动范围和多行）
          const currentY = baseY + waveOffset
          const isHovered =
            p.mouseX >= baseX &&
            p.mouseX <= baseX + textW &&
            p.mouseY >= currentY - textH / 2 &&
            p.mouseY <= currentY + textH / 2

          // 更新悬停状态
          const currentTime = p.millis()
          if (isHovered) {
            hoverTimes.set(index, currentTime)
          }

          // 计算波浪效果的强度系数（0到1之间）
          const lastHoverTime = hoverTimes.get(index) || 0
          const timeSinceHover = currentTime - lastHoverTime
          let waveIntensity = 0

          if (isHovered) {
            waveIntensity = 1
          } else if (lastHoverTime > 0) {
            if (timeSinceHover < hoverKeepDuration) {
              waveIntensity = 1
            } else if (timeSinceHover < hoverTotalDuration) {
              const fadeProgress =
                (timeSinceHover - hoverKeepDuration) / hoverFadeDuration
              waveIntensity = 1 - fadeProgress
            } else {
              hoverTimes.delete(index)
              waveIntensity = 0
            }
          }

          // 使用配置的位置加上整个句子的波浪偏移
          const x = baseX
          const y = currentY

          // 不绘制描边
          p.noStroke()

          // 绘制文字（支持下标和字母波浪效果，传入强度系数）
          p.fill(fontColor[0], fontColor[1], fontColor[2])
          drawTextWithSubscript(
            textItem.text,
            x,
            y,
            waveIntensity > 0,
            waveIntensity
          )
        })
      }

      // 窗口大小改变时重新调整画布
      p.windowResized = () => {
        let canvasWidth = width > 0 ? width : p.windowWidth
        let canvasHeight = height > 0 ? height : p.windowHeight

        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect()
          if (containerRect.width > 0) canvasWidth = containerRect.width
          if (containerRect.height > 0) canvasHeight = containerRect.height
        }

        p.resizeCanvas(canvasWidth, canvasHeight)
      }
    }

    // 确保容器是可见的并且有尺寸
    if (containerRef.current) {
      const container = containerRef.current
      container.style.display = 'block'
      container.style.width = '100%'
      container.style.height = '100%'
    }

    try {
      if (!containerRef.current?.isConnected) {
        console.error('P5WaveText: 容器未连接到 DOM！')
        return
      }

      p5InstanceRef.current = new p5(sketch, containerRef.current)
      console.log('P5WaveText: p5 实例已创建')
    } catch (error) {
      console.error('P5WaveText: 创建 p5 实例时出错', error)
    }
  }

  const setContainerRef = (el: HTMLDivElement | null) => {
    containerRef.current = el
    // 移除这里的初始化，让 useEffect 统一管理
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
  }, [
    width,
    height,
    imagePath,
    texts,
    fontSize,
    fontColor,
    fontPath,
    waveAmplitude,
    letterWaveAmplitude,
    letterWaveSpeed,
    waveSpeed,
    waveFrequency,
    hoverKeepDuration,
    hoverFadeDuration
  ])

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

