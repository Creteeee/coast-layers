import { useEffect, useRef } from 'react'
import p5 from 'p5'

interface P5Sketch2Props {
  width?: number
  height?: number
  className?: string
  effectType?: 'particles' | 'waves' | 'custom' // 可以扩展更多效果类型
}

export default function P5Sketch2({ 
  width = 800, 
  height = 600,
  className = '',
  effectType = 'particles'
}: P5Sketch2Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<p5 | null>(null)

  function initializeP5() {
    if (!containerRef.current) {
      console.error('P5Sketch2: initializeP5 被调用但容器为空')
      return
    }
    
    // 如果已经存在 p5 实例，先清理
    if (p5InstanceRef.current) {
      console.log('P5Sketch2: 清理旧的 p5 实例')
      p5InstanceRef.current.remove()
      p5InstanceRef.current = null
    }
    
    console.log('P5Sketch2: 开始初始化', { 
      width, 
      height, 
      effectType,
      container: containerRef.current
    })

    const sketch = (p: p5) => {
      console.log('P5Sketch2: sketch 函数被调用！', { effectType })

      // ============================================
      // 粒子效果示例
      // ============================================
      if (effectType === 'particles') {
        interface Particle {
          x: number
          y: number
          vx: number
          vy: number
          size: number
          color: p5.Color
          life: number
          maxLife: number
        }

        let particles: Particle[] = []
        let customFont: p5.Font | null = null
        let bgImage: p5.Image | null = null

        p.preload = () => {
          // 加载字体（如果需要）
          try {
            const fontPath = '/coast-layers/p5-assets/fonts/LetterGothicStd-Bold.otf'
            customFont = p.loadFont(fontPath)
          } catch (e) {
            console.warn('P5Sketch2: 字体加载失败，使用默认字体', e)
            customFont = null
          }
          
          // 加载背景图片（如果需要）
          try {
            const imagePath = '/coast-layers/p5-assets/images/autumn_layer2_1.png'
            bgImage = p.loadImage(imagePath)
          } catch (e) {
            console.warn('P5Sketch2: 图片加载失败', e)
            bgImage = null
          }
        }

        p.setup = () => {
          const canvasWidth = width > 0 ? width : p.windowWidth
          const canvasHeight = height > 0 ? height : p.windowHeight
          
          p.createCanvas(canvasWidth, canvasHeight)
          p.background(0)
          
          if (customFont) {
            p.textFont(customFont)
          }

          // 初始化一些粒子
          for (let i = 0; i < 50; i++) {
            particles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              vx: p.random(-2, 2),
              vy: p.random(-2, 2),
              size: p.random(2, 8),
              color: p.color(255, 255, 255, 150),
              life: p.random(100, 200),
              maxLife: p.random(100, 200)
            })
          }
        }

        p.draw = () => {
          // 绘制背景
          if (bgImage && bgImage.width > 0 && bgImage.height > 0) {
            const canvasWidth = width > 0 ? width : p.width
            const canvasHeight = height > 0 ? height : p.height
            const imageAspect = bgImage.width / bgImage.height
            const canvasAspect = canvasWidth / canvasHeight
            
            let drawWidth, drawHeight, drawX, drawY
            
            if (imageAspect > canvasAspect) {
              drawWidth = canvasWidth
              drawHeight = drawWidth / imageAspect
              drawX = 0
              drawY = (canvasHeight - drawHeight) / 2
            } else {
              drawHeight = canvasHeight
              drawWidth = drawHeight * imageAspect
              drawX = (canvasWidth - drawWidth) / 2
              drawY = 0
            }
            
            p.image(bgImage, drawX, drawY, drawWidth, drawHeight)
          } else {
            p.background(0, 20) // 半透明黑色，形成拖尾效果
          }

          // 更新和绘制粒子
          for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i]
            
            // 更新位置
            particle.x += particle.vx
            particle.y += particle.vy
            
            // 边界反弹
            if (particle.x < 0 || particle.x > p.width) particle.vx *= -1
            if (particle.y < 0 || particle.y > p.height) particle.vy *= -1
            
            // 更新生命周期
            particle.life--
            
            // 根据生命周期调整透明度
            const alpha = p.map(particle.life, 0, particle.maxLife, 0, 255)
            particle.color.setAlpha(alpha)
            
            // 绘制粒子
            p.fill(particle.color)
            p.noStroke()
            p.ellipse(particle.x, particle.y, particle.size)
            
            // 移除死亡的粒子
            if (particle.life <= 0) {
              particles.splice(i, 1)
            }
          }

          // 补充新粒子
          if (particles.length < 50 && p.frameCount % 10 === 0) {
            particles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              vx: p.random(-2, 2),
              vy: p.random(-2, 2),
              size: p.random(2, 8),
              color: p.color(255, 255, 255, 150),
              life: p.random(100, 200),
              maxLife: p.random(100, 200)
            })
          }
        }

        // 鼠标交互
        p.mousePressed = () => {
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: p.mouseX,
              y: p.mouseY,
              vx: p.random(-5, 5),
              vy: p.random(-5, 5),
              size: p.random(3, 10),
              color: p.color(255, 200, 100, 200),
              life: p.random(50, 150),
              maxLife: p.random(50, 150)
            })
          }
        }
      }

      // ============================================
      // 波浪效果示例
      // ============================================
      else if (effectType === 'waves') {
        let waveOffset = 0
        let customFont: p5.Font | null = null
        let bgImage: p5.Image | null = null

        p.preload = () => {
          try {
            const fontPath = '/coast-layers/p5-assets/fonts/LetterGothicStd-Bold.otf'
            customFont = p.loadFont(fontPath)
          } catch (e) {
            customFont = null
          }
          
          try {
            const imagePath = '/coast-layers/p5-assets/images/autumn_layer2_1.png'
            bgImage = p.loadImage(imagePath)
          } catch (e) {
            bgImage = null
          }
        }

        p.setup = () => {
          const canvasWidth = width > 0 ? width : p.windowWidth
          const canvasHeight = height > 0 ? height : p.windowHeight
          
          p.createCanvas(canvasWidth, canvasHeight)
          
          if (customFont) {
            p.textFont(customFont)
          }
        }

        p.draw = () => {
          // 绘制背景
          if (bgImage && bgImage.width > 0 && bgImage.height > 0) {
            const canvasWidth = width > 0 ? width : p.width
            const canvasHeight = height > 0 ? height : p.height
            const imageAspect = bgImage.width / bgImage.height
            const canvasAspect = canvasWidth / canvasHeight
            
            let drawWidth, drawHeight, drawX, drawY
            
            if (imageAspect > canvasAspect) {
              drawWidth = canvasWidth
              drawHeight = drawWidth / imageAspect
              drawX = 0
              drawY = (canvasHeight - drawHeight) / 2
            } else {
              drawHeight = canvasHeight
              drawWidth = drawHeight * imageAspect
              drawX = (canvasWidth - drawWidth) / 2
              drawY = 0
            }
            
            p.image(bgImage, drawX, drawY, drawWidth, drawHeight)
          } else {
            p.background(0)
          }

          // 绘制波浪
          p.stroke(255, 200, 100, 150)
          p.strokeWeight(2)
          p.noFill()

          waveOffset += 0.05

          for (let y = 0; y < p.height; y += 20) {
            p.beginShape()
            for (let x = 0; x < p.width; x += 5) {
              const wave = p.sin((x * 0.01) + waveOffset + (y * 0.01)) * 30
              p.vertex(x, y + wave)
            }
            p.endShape()
          }
        }
      }

      // ============================================
      // 自定义效果模板
      // ============================================
      else if (effectType === 'custom') {
        let customFont: p5.Font | null = null
        let bgImage: p5.Image | null = null

        p.preload = () => {
          try {
            const fontPath = '/coast-layers/p5-assets/fonts/LetterGothicStd-Bold.otf'
            customFont = p.loadFont(fontPath)
          } catch (e) {
            customFont = null
          }
          
          try {
            const imagePath = '/coast-layers/p5-assets/images/autumn_layer2_1.png'
            bgImage = p.loadImage(imagePath)
          } catch (e) {
            bgImage = null
          }
        }

        p.setup = () => {
          const canvasWidth = width > 0 ? width : p.windowWidth
          const canvasHeight = height > 0 ? height : p.windowHeight
          
          p.createCanvas(canvasWidth, canvasHeight)
          p.background(0)
          
          if (customFont) {
            p.textFont(customFont)
          }
        }

        p.draw = () => {
          // 绘制背景
          if (bgImage && bgImage.width > 0 && bgImage.height > 0) {
            const canvasWidth = width > 0 ? width : p.width
            const canvasHeight = height > 0 ? height : p.height
            const imageAspect = bgImage.width / bgImage.height
            const canvasAspect = canvasWidth / canvasHeight
            
            let drawWidth, drawHeight, drawX, drawY
            
            if (imageAspect > canvasAspect) {
              drawWidth = canvasWidth
              drawHeight = drawWidth / imageAspect
              drawX = 0
              drawY = (canvasHeight - drawHeight) / 2
            } else {
              drawHeight = canvasHeight
              drawWidth = drawHeight * imageAspect
              drawX = (canvasWidth - drawWidth) / 2
              drawY = 0
            }
            
            p.image(bgImage, drawX, drawY, drawWidth, drawHeight)
          } else {
            p.background(0)
          }

          // 在这里添加你的自定义效果代码
          p.fill(255, 100)
          p.noStroke()
          p.ellipse(p.mouseX, p.mouseY, 50, 50)
        }
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
        console.error('P5Sketch2: 容器未连接到 DOM！')
        return
      }
      
      p5InstanceRef.current = new p5(sketch, containerRef.current)
      console.log('P5Sketch2: p5 实例已创建')
    } catch (error) {
      console.error('P5Sketch2: 创建 p5 实例时出错', error)
    }
  }

  const setContainerRef = (el: HTMLDivElement | null) => {
    containerRef.current = el
    
    if (el && !p5InstanceRef.current) {
      setTimeout(() => {
        if (containerRef.current && !p5InstanceRef.current) {
          initializeP5()
        }
      }, 0)
    }
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
  }, [width, height, effectType])

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



