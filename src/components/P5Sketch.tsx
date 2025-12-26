import { useEffect, useRef } from 'react'
import p5 from 'p5'

interface P5SketchProps {
  width?: number
  height?: number
  className?: string
}

interface Letter {
  letter: string
  x: number
  y: number
  vy: number
  falling: boolean
  lineIndex: number
  lineLength: number
  originalX: number
  initialYOffset: number
  isRestored: boolean
}

export default function P5Sketch({ 
  width = 800, 
  height = 600,
  className = '' 
}: P5SketchProps) {
  console.log('🚀 P5Sketch: 组件被创建', { width, height, className })
  console.error('🚀 P5Sketch: 组件被创建 (ERROR级别，确保可见)', { width, height, className })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<p5 | null>(null)

  // 定义初始化函数（在组件作用域内，可以被 ref 回调和 useEffect 共享）
  function initializeP5() {
    if (!containerRef.current) {
      console.error('P5Sketch: initializeP5 被调用但容器为空')
      return
    }
    
    // 如果已经存在 p5 实例，先清理
    if (p5InstanceRef.current) {
      console.log('P5Sketch: 清理旧的 p5 实例')
      p5InstanceRef.current.remove()
      p5InstanceRef.current = null
    }
    
    console.log('P5Sketch: 开始初始化', { 
      width, 
      height, 
      container: containerRef.current,
      containerInDOM: containerRef.current.isConnected,
      containerParent: containerRef.current.parentElement
    })

    // 创建 p5 sketch
    console.log('P5Sketch: 开始定义 sketch 函数', { p5Available: typeof p5 !== 'undefined', p5 })
    const sketch = (p: p5) => {
      console.log('P5Sketch: sketch 函数被调用！', { p, pType: typeof p, pKeys: Object.keys(p || {}) })
      
      /************************************************
       * 字母下落效果
       * 每个字母像沙子一样掉落并堆积
       * 鼠标经过字母时，字母下落，不会消失
       * 原文的位置直接空着，不补全
       ************************************************/

      let letters: Letter[] = [] // 用来存储字母对象的数组
      let staticText = `Mat-forming organisms such as mussels (M. senhousia) or algae \n(Caulerpa spp.) that blanket the sediment surface may have a reverse \neffect, homogenizing sediments by trapping fine particles and promoting \ndysaerobic or anaerobic conditions, or by limiting access to \nparticles for subsurface feeders below. as Bioturbation Index \n(as 0 = low and 6 = reworked) or Ichnofabric Index (as 0 = low and \n6 = reworked), both systems are supported with visual aids for the \nestimation of bioturbation intensity.` // 静态文字内容

      // ⭐ 字母的字体大小
      let fontSize = 16

      // ⭐ 字母下落的速度范围
      let gravityMin = 0.6
      let gravityMax = 1.5

      // ⭐ 每个字母下落的横向扰动强度
      let horizontalJitter = 0.3

      let customFont: p5.Font | null = null  // 用于存储加载的自定义字体
      let bgImage: p5.Image | null = null  // 用于存储加载的底图

      p.preload = () => {
        console.log('P5Sketch: preload 被调用')
        // ⭐ 加载自定义字体（使用 public/p5-assets/fonts 目录下的字体）
        // 根据 vite.config.ts 中的 base: '/coast-layers/'，需要使用带 base 前缀的路径
        const fontPath = '/coast-layers/p5-assets/fonts/LetterGothicStd-Bold.otf'
        console.log('P5Sketch: 开始加载字体', fontPath)
        try {
          customFont = p.loadFont(fontPath)
          console.log('P5Sketch: 字体加载命令已执行', customFont)
        } catch (e) {
          console.error('P5Sketch: 字体加载出错', e)
          // 即使字体加载失败，也继续执行，使用默认字体
          customFont = null
        }
        
        // ⭐ 加载底图（使用 public/p5-assets/images 目录下的图片）
        const imagePath = '/coast-layers/p5-assets/images/autumn_layer2_1.png'
        
        console.log('P5Sketch: 开始加载图片', imagePath)
        bgImage = p.loadImage(
          imagePath,
          () => {
            // 成功回调
            console.log('P5Sketch: 图片加载成功', bgImage)
          },
          () => {
            // 失败回调
            console.error('P5Sketch: 图片加载失败，将使用黑色背景')
          }
        )
        console.log('P5Sketch: 图片加载命令已执行', bgImage)
      }

      p.setup = () => {
        // 如果 width 或 height 为 0，使用窗口尺寸
        const canvasWidth = width > 0 ? width : p.windowWidth
        const canvasHeight = height > 0 ? height : p.windowHeight
        console.log('P5Sketch: setup 被调用', { canvasWidth, canvasHeight, width, height, container: containerRef.current })
        
        try {
          p.createCanvas(canvasWidth, canvasHeight)
          p.background(0) // 设置黑色背景，而不是清空
          
          // 确保 canvas 可见
          const canvas = p.select('canvas')
          if (canvas) {
            canvas.style('display', 'block')
            canvas.style('position', 'relative')
            canvas.style('z-index', '1')
            console.log('P5Sketch: canvas 样式已设置', canvas)
          }

          // 使用加载的字体（如果加载成功）
          if (customFont) {
            p.textFont(customFont)
            console.log('P5Sketch: 使用自定义字体', customFont)
          } else {
            console.warn('P5Sketch: 自定义字体未加载，使用默认字体')
          }
        } catch (error) {
          console.error('P5Sketch: setup 中出错', error)
          // 即使出错，也尝试创建 canvas
          try {
            p.createCanvas(canvasWidth || 800, canvasHeight || 600)
            p.background(0)
          } catch (e) {
            console.error('P5Sketch: 无法创建 canvas', e)
          }
        }

        // ===============================
        // ⭐⭐ 修改文字内容和位置 ⭐⭐
        let textContent = `Bioturbation Intensity: the degree to which a sediment is burrowed. \nSometimes reported as an approximated proportion or percentage. \nMore typically, bioturbation intensity is Burrowing activities increase \nmicrohabitat heterogeneity and control the distribution \nand fluxes of oxidants (oxygen, nitrate, and iron), \nthereby enhancing aerobic remineralization, sulfate reduction, \nammonium oxidation, and denitrification (Kristensen and Kostka, 2005; \nMarinelli and Waldbusser, 2005; Bertics and Ziebis, 2009).` // 第一段文字内容
        let textX = canvasWidth * 0.1   // ← 水平位置
        let textY = canvasHeight * 0.25   // 第一段文字的垂直基线位置
        // ===============================

        // ⭐ 根据第一段文字内容生成每个字母的下落对象
        let lineHeight = fontSize * 1.4 // 每行文字之间的间距
        let lines = textContent.split("\n") // 根据换行符分割文本为多行

        let yOffset = textY // 起始位置

        // 逐行生成字母
        for (let i = 0; i < lines.length; i++) { // 从第一行开始
          let line = lines[i]
          for (let j = 0; j < line.length; j++) {
            let letter = line.charAt(j)
            letters.push({
              letter: letter,          // 当前字母
              x: textX + j * (fontSize * 0.6), // 水平位置（字母之间有间距）
              y: yOffset,             // 字母的初始垂直位置
              vy: p.random(gravityMin, gravityMax), // 每个字母的下落速度
              falling: false,           // 字母是否开始下落
              lineIndex: i,             // 记录当前字母在行中的位置
              lineLength: line.length,  // 当前行的字母数量
              originalX: textX + j * (fontSize * 0.8), // 用于计算横向堆积时的偏移量
              initialYOffset: yOffset,  // 保存字母的初始位置，控制堆积效果
              isRestored: false         // 字母是否已恢复
            })
          }
          yOffset += lineHeight // 调整下一行的垂直位置
        }
      }

      p.draw = () => {
        // 只在第一次绘制时打印调试信息
        if (p.frameCount === 1) {
          console.log('P5Sketch: draw 第一次被调用', { 
            bgImage, 
            hasBgImage: !!bgImage,
            imageWidth: bgImage?.width,
            imageHeight: bgImage?.height,
            canvasWidth: p.width,
            canvasHeight: p.height
          })
        }
        
        // 绘制底图（完全显示，类似 contain：图片完整显示，保持宽高比，可能有空白）
        // 检查图片是否已加载（p5.js 图片加载是异步的）
        if (bgImage && bgImage.width > 0 && bgImage.height > 0) {
          const canvasWidth = width > 0 ? width : p.width
          const canvasHeight = height > 0 ? height : p.height
          
          // 计算缩放比例，使图片完全显示在 canvas 内（类似 CSS background-size: contain）
          const imageAspect = bgImage.width / bgImage.height
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
          
          p.image(bgImage, drawX, drawY, drawWidth, drawHeight)
        } else {
          // 如果图片未加载，设置背景色而不是清空
          p.background(0) // 黑色背景
        }

        updateLetters() // 更新字母的位置
        drawLetters()   // 绘制字母

        drawStaticText() // 绘制静态文字
      }

      function updateLetters() {
        // 控制字母逐行下落
        for (let letterObj of letters) {
          // 检查鼠标是否经过当前字母的位置
          let distToMouse = p.dist(p.mouseX, p.mouseY, letterObj.x, letterObj.y)
          if (distToMouse < fontSize) { // 如果鼠标接近字母，开始掉落
            if (!letterObj.falling && !letterObj.isRestored) {
              letterObj.falling = true // 第一次让字母掉落
            }
          }

          // ⭐ 如果字母还在下落
          if (letterObj.falling) {
            letterObj.y += letterObj.vy // 让字母下落
            letterObj.x += p.random(-horizontalJitter, horizontalJitter) // 添加横向扰动

            // ⭐ 如果字母到达底部，停止下落并堆积
            const canvasHeight = height > 0 ? height : p.height
            if (letterObj.y > canvasHeight - 50) {  // 到达底部
              letterObj.y = canvasHeight - 50  // 保持字母在底部
              letterObj.vy = 0           // 停止下落
            }
          }
        }
      }

      function drawLetters() {
        p.noStroke() // 不画边框

        p.fill(0) // 设置字母颜色（黑色）

        // 绘制每个字母
        for (let letterObj of letters) {
          p.textSize(fontSize)  // 设置字体大小
          p.text(letterObj.letter, letterObj.x, letterObj.y)  // 绘制字母
        }
      }

      // 绘制静态文字
      function drawStaticText() {
        p.noStroke() // 不画边框

        p.fill(0) // 设置静态文字颜色（黑色）
        // p.fill(255) // 如果底图较深，可以使用白色

        // 设置静态文字的起始位置
        const canvasWidth = width > 0 ? width : p.width
        const canvasHeight = height > 0 ? height : p.height
        let staticTextX = canvasWidth * 0.1
        let staticTextY = canvasHeight * 0.6  // 静态文字位置，第一段文字正上方
        let lines = staticText.split("\n") // 根据换行符分割文本为多行
        p.textSize(16)  // 设置静态文字大小

        // 绘制静态文字
        for (let i = 0; i < lines.length; i++) {
          p.text(lines[i], staticTextX, staticTextY + i * (fontSize * 1.4)) // 每行文字垂直分开
        }
      }
    }

    // 确保容器是可见的并且有尺寸
    if (containerRef.current) {
      const container = containerRef.current
      container.style.display = 'block'
      container.style.width = '100%'
      container.style.height = '100%'
      console.log('P5Sketch: 容器样式已设置', {
        display: container.style.display,
        width: container.style.width,
        height: container.style.height,
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight
      })
    }
    
    try {
      console.log('P5Sketch: 准备创建 p5 实例，容器信息:', {
        container: containerRef.current,
        containerType: containerRef.current?.tagName,
        containerInDOM: containerRef.current?.isConnected,
        containerParent: containerRef.current?.parentElement,
        containerHTML: containerRef.current?.innerHTML
      })
      
      console.log('P5Sketch: 开始创建 p5 实例，sketch 函数类型:', typeof sketch)
      
      // 确保容器在 DOM 中
      if (!containerRef.current?.isConnected) {
        console.error('P5Sketch: 容器未连接到 DOM！')
        return
      }
      
      p5InstanceRef.current = new p5(sketch, containerRef.current)
      
      console.log('P5Sketch: p5 实例已创建', {
        instance: p5InstanceRef.current,
        instanceType: typeof p5InstanceRef.current,
        hasCanvas: !!containerRef.current?.querySelector('canvas'),
        containerHTML: containerRef.current?.innerHTML
      })
      
      // 立即检查一次
      const immediateCanvas = containerRef.current?.querySelector('canvas')
      console.log('P5Sketch: 立即检查 canvas', { hasCanvas: !!immediateCanvas, canvas: immediateCanvas })
    } catch (error) {
      console.error('P5Sketch: 创建 p5 实例时出错', error)
    }
    
    // 检查 canvas 是否创建 - 增加延迟和多次检查
    const checkCanvas = (attempt = 1) => {
      if (!containerRef.current) return
      
      const canvas = containerRef.current.querySelector('canvas')
      console.log(`P5Sketch: 检查 canvas (尝试 ${attempt})`, { 
        hasCanvas: !!canvas, 
        canvas, 
        container: containerRef.current,
        containerHTML: containerRef.current.innerHTML,
        containerWidth: containerRef.current.offsetWidth,
        containerHeight: containerRef.current.offsetHeight
      })
      
      if (canvas) {
        console.log('P5Sketch: canvas 已找到！', {
          width: canvas.width,
          height: canvas.height,
          styleWidth: canvas.style.width,
          styleHeight: canvas.style.height,
          display: window.getComputedStyle(canvas).display,
          visibility: window.getComputedStyle(canvas).visibility,
          zIndex: window.getComputedStyle(canvas).zIndex,
          parent: canvas.parentElement
        })
      } else if (attempt < 5) {
        // 如果 canvas 还没创建，继续检查
        setTimeout(() => checkCanvas(attempt + 1), 200)
      } else {
        console.error('P5Sketch: canvas 在多次尝试后仍未创建！')
      }
    }
    
    // 立即检查一次，然后延迟检查
    setTimeout(() => checkCanvas(1), 100)
    setTimeout(() => checkCanvas(2), 500)
    setTimeout(() => checkCanvas(3), 1000)
  }

  // 使用 ref 回调确保容器挂载后立即初始化
  const setContainerRef = (el: HTMLDivElement | null) => {
    console.error('📌 P5Sketch: ref 回调被调用', { el, previous: containerRef.current })
    containerRef.current = el
    
    // 如果容器已挂载且 p5 实例还未创建，立即初始化
    if (el && !p5InstanceRef.current) {
      console.error('📌 P5Sketch: 容器已挂载，准备初始化 p5')
      // 使用 setTimeout 确保 DOM 完全更新
      setTimeout(() => {
        if (containerRef.current && !p5InstanceRef.current) {
          initializeP5()
        }
      }, 0)
    }
  }

  console.error('🔧 P5Sketch: useEffect 定义之前', { 
    hasUseEffect: typeof useEffect !== 'undefined',
    containerRef: containerRef.current,
    width,
    height
  })

  useEffect(() => {
    console.error('🔥🔥🔥 P5Sketch: useEffect 被调用 (ERROR级别)', {
      containerRef: containerRef.current,
      hasContainer: !!containerRef.current,
      width,
      height,
      timestamp: Date.now()
    })

    // 如果容器已存在，立即初始化
    if (containerRef.current) {
      console.log('P5Sketch: 容器已存在，立即初始化')
      initializeP5()
    } else {
      console.warn('P5Sketch: containerRef.current 为空，等待容器挂载...')
      // 等待容器挂载 - 使用更短的延迟并重试
      let retryCount = 0
      const checkContainer = () => {
        retryCount++
        console.log(`P5Sketch: 检查容器 (尝试 ${retryCount})`, { 
          hasContainer: !!containerRef.current,
          container: containerRef.current
        })
        
        if (containerRef.current) {
          console.log('P5Sketch: 容器已找到，开始初始化')
          initializeP5()
        } else if (retryCount < 10) {
          // 继续等待
          setTimeout(checkContainer, 100)
        } else {
          console.error('P5Sketch: 容器在多次尝试后仍未挂载，无法初始化')
        }
      }
      
      setTimeout(checkContainer, 100)
    }

    // 清理函数
    return () => {
      console.log('P5Sketch: 清理函数被调用')
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove()
        p5InstanceRef.current = null
      }
    }
  }, [width, height])

  console.log('P5Sketch: 渲染 JSX', { 
    containerRef: containerRef.current,
    hasContainer: !!containerRef.current,
    className 
  })
  
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
