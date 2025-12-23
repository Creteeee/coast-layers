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

        const clickedStack = seasonRefs.current[season]
        const otherSeasons = SEASONS.filter(s => s !== season)

        if (!clickedStack || !sectionRef.current) return

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

        // 放大并移动到画面中央
        gsap.to(clickedStack, {
            x: deltaX,
            y: deltaY,
            scale: 2.5,
            duration: 0.8,
            ease: 'power2.inOut',
            zIndex: 10,
        })

        // 其他stack向上移走
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

        setTimeout(() => {
            setIsAnimating(false)
        }, 800)
    }

    const handleBackClick = () => {
        if (isAnimating || !selectedSeason) return
        setIsAnimating(true)

        const selectedStack = seasonRefs.current[selectedSeason]
        const otherSeasons = SEASONS.filter(s => s !== selectedSeason)

        if (!selectedStack) return

        // 当前stack缩小并回归原位
        gsap.to(selectedStack, {
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power2.inOut',
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

        setTimeout(() => {
            setSelectedSeason(null)
            setIsAnimating(false)
        }, 800)
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
                {selectedSeason && (
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
                            className="season-stack"
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
