import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import './index.css'

const SEASONS = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']

export default function App() {
    const titleRef = useRef<HTMLDivElement>(null)
    const seasonRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    const sectionRef = useRef<HTMLElement>(null)
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null)
    const [isAnimating, setIsAnimating] = useState(false)
    // 控制返回按钮何时可见（只在层完成偏移后才出现）
    const [canGoBack, setCanGoBack] = useState(false)

    useEffect(() => {
        if (!titleRef.current) return

        gsap.fromTo(
            titleRef.current,
            { y: 10, opacity: 0.6 },
            {
                y: -10,
                opacity: 1,
                duration: 4,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
            }
        )
    }, [])

    const handleSeasonClick = (season: string) => {
        if (isAnimating || selectedSeason) return
        setIsAnimating(true)
        setSelectedSeason(season)
        setCanGoBack(false)

        const clickedStack = seasonRefs.current[season]
        const otherSeasons = SEASONS.filter((s) => s !== season)

        if (!clickedStack || !sectionRef.current) return

        const topLayer = clickedStack.querySelector<HTMLDivElement>('.l1')
        const bottomLayer = clickedStack.querySelector<HTMLDivElement>('.l3')

        // 获取section的边界框
        const sectionRect = sectionRef.current.getBoundingClientRect()
        // 计算画面中央位置
        const sectionCenterX = sectionRect.width / 2
        const sectionCenterY = sectionRect.height / 2

        // 获取点击的stack的初始位置和尺寸
        const clickedRect = clickedStack.getBoundingClientRect()
        const initialX = clickedRect.left - sectionRect.left + clickedRect.width / 2
        const initialY = clickedRect.top - sectionRect.top + clickedRect.height / 2

        // 计算需要移动的距离（使stack的中心点移动到section的中心）
        const deltaX = sectionCenterX - initialX
        const deltaY = sectionCenterY - initialY

        // 先让整个 stack 放大到中心，然后再展开 l1 / l3
        const tl = gsap.timeline({
            defaults: { duration: 0.8, ease: 'power2.inOut' },
            onComplete: () => {
                setIsAnimating(false)
                setCanGoBack(true) // 展开完成后才允许返回 & 显示按钮
            },
        })

        tl.to(clickedStack, {
            x: deltaX,
            y: deltaY,
            scale: 2,
            zIndex: 10,
        })

        // 第二段：层展开（l1 左移，l3 右移）——使用 xPercent，偏移相对于自身宽度
        tl.addLabel('spread')
        if (topLayer) {
            tl.to(
                topLayer,
                {
                    xPercent: -40,
                },
                'spread'
            )
        }
        if (bottomLayer) {
            tl.to(
                bottomLayer,
                {
                    xPercent: 40,
                },
                'spread'
            )
        }

        // 其他 stack 向上移走
        otherSeasons.forEach((otherSeason, index) => {
            const otherStack = seasonRefs.current[otherSeason]
            if (otherStack) {
                gsap.to(otherStack, {
                    y: -window.innerHeight,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power2.inOut',
                    delay: index * 0.1,
                })
            }
        })
    }

    const handleBackClick = () => {
        // 只有在展开完成且当前没有其他动画时才能返回
        if (isAnimating || !selectedSeason || !canGoBack) return
        setIsAnimating(true)
        setCanGoBack(false)

        const selectedStack = seasonRefs.current[selectedSeason]
        const otherSeasons = SEASONS.filter((s) => s !== selectedSeason)

        if (!selectedStack) return

        const topLayer = selectedStack.querySelector<HTMLDivElement>('.l1')
        const bottomLayer = selectedStack.querySelector<HTMLDivElement>('.l3')

        // 先让 l1 / l3 回位，再让整个 stack 回到原来的位置
        const tl = gsap.timeline({
            defaults: { duration: 0.8, ease: 'power2.inOut' },
            onComplete: () => {
                // 清理层上的 xPercent 偏移，完全回到 CSS 初始状态
                if (topLayer) gsap.set(topLayer, { clearProps: 'xPercent' })
                if (bottomLayer) gsap.set(bottomLayer, { clearProps: 'xPercent' })

                setSelectedSeason(null)
                setIsAnimating(false)
            },
        })

        // 第一步：l1 / l3 收回（反向还原 xPercent）
        if (topLayer) {
            tl.to(
                topLayer,
                {
                    xPercent: 0,
                },
                0
            )
        }
        if (bottomLayer) {
            tl.to(
                bottomLayer,
                {
                    xPercent: 0,
                },
                0
            )
        }

        // 第二步：整个 stack 回到原位
        tl.to(selectedStack, {
            x: 0,
            y: 0,
            scale: 1,
            zIndex: 1,
        })

        // 其他stack下移回归
        otherSeasons.forEach((otherSeason, index) => {
            const otherStack = seasonRefs.current[otherSeason]
            if (otherStack) {
                // 先清除之前的transform，然后动画回归
                gsap.set(otherStack, { clearProps: 'transform' })
                gsap.to(otherStack, {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: 'power2.inOut',
                    delay: index * 0.1,
                })
            }
        })
    }

    return (
        <div className="page">
            {/* ===== Header ===== */}
            <header className="header">
                <div className="header-title" ref={titleRef}>
                    THROUGH THE LAYERS
                </div>
                <div className="header-sub">
                    GEOLOGICAL SECTIONS OF<br />
                    SHANGHAI'S COAST
                </div>
            </header>

            {/* ===== White Section ===== */}
            <section className="section" ref={sectionRef}>
                {selectedSeason && canGoBack && (
                    <button 
                        className="back-button"
                        aria-label="Back"
                        onClick={handleBackClick}
                    >
                        Back
                    </button>
                )}
                <div className="season-row">
                    {SEASONS.map((season) => (
                        <div 
                            key={season} 
                            className={`season-stack season-${season.toLowerCase()}`}
                            ref={(el) => { seasonRefs.current[season] = el }}
                            onClick={() => handleSeasonClick(season)}
                        >
                            <div className="layers">
                                <div className="layer l1" />
                                <div className="layer l2" />
                                <div className="layer l3" />
                            </div>
                            <div className="season-name">{season}</div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
