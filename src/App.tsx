import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import LayerDetail from './components/LayerDetail'
import './index.css'
import { getLayerData } from './utils/layerData'
import type { Season } from './types/layer'

const SEASONS = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']

export default function App() {
    const titleRef = useRef<HTMLDivElement>(null)
    const headerSubRef = useRef<HTMLDivElement>(null)
    const seasonRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    const sectionRef = useRef<HTMLElement>(null)
    const initialSectionHeightRef = useRef<number | null>(null)
    const [sliceMap, setSliceMap] = useState<Record<string, string[]>>({})
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null)
    const [isAnimating, setIsAnimating] = useState(false)
    // 控制返回按钮何时可见（只在层完成偏移后才出现）
    const [canGoBack, setCanGoBack] = useState(false)
    // 当前处于聚焦状态的 layer（1/2/3），null 表示仍是三个 layer 共存的二级画面
    const [selectedLayer, setSelectedLayer] = useState<number | null>(null)
    const [selectedTexIndex, setSelectedTexIndex] = useState<number>(1)
    // 是否显示四级界面（layer详情）
    const [showLayerDetail, setShowLayerDetail] = useState(false)
    const seasonTitleRef = useRef<HTMLDivElement | null>(null)
    const [sliceTooltip, setSliceTooltip] = useState<{
        name: string
        intro: string
        pos: { x: number; y: number }
        anchor: { x: number; y: number }
        texIndex: number
    } | null>(null)

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

    // 二级界面左上角季节标题海浪动画
    useEffect(() => {
        if (!seasonTitleRef.current) return
        // 仅在二级界面时播放（有 selectedSeason 且 canGoBack）
        if (!selectedSeason || !canGoBack) {
            gsap.killTweensOf(seasonTitleRef.current)
            return
        }
        gsap.fromTo(
            seasonTitleRef.current,
            { y: 8, opacity: 0.7 },
            {
                y: -8,
                opacity: 1,
                duration: 4,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
            }
        )
    }, [selectedSeason, canGoBack])

    useEffect(() => {
        const checkImage = (src: string) =>
            new Promise<boolean>((resolve) => {
                const img = new Image()
                img.onload = () => resolve(true)
                img.onerror = () => resolve(false)
                img.src = src
            })

        const loadSlices = async () => {
            const next: Record<string, string[]> = {}
            for (const season of SEASONS) {
                for (const layer of [1, 2, 3]) {
                    const key = `${season}-${layer}`
                    const candidates = [1, 2, 3].map(
                        (i) => `/coast-layers/textures/p_${season.toLowerCase()}_l${layer}_${i}.png`
                    )
                    const exists = await Promise.all(candidates.map(checkImage))
                    const valid = candidates.filter((_, idx) => exists[idx])
                    next[key] = valid.length ? valid : ['/coast-layers/textures/default_white.png']
                }
            }
            setSliceMap(next)
        }

        loadSlices()
    }, [])

    const handleSeasonClick = (season: string) => {
        // 如果已经在动画中或已有选中的季节，直接返回
        if (isAnimating || selectedSeason) return

        const clickedStack = seasonRefs.current[season]
        const otherSeasons = SEASONS.filter((s) => s !== season)

        // 先检查必要的元素是否存在，避免状态不一致
        if (!clickedStack || !sectionRef.current) return

        // 确认可以执行后再设置状态
        setIsAnimating(true)
        setSelectedSeason(season)
        setSelectedLayer(null)
        setCanGoBack(false)

        const topLayer = clickedStack.querySelector<HTMLDivElement>('.l1')
        const bottomLayer = clickedStack.querySelector<HTMLDivElement>('.l3')
        const seasonLabel = clickedStack.querySelector<HTMLDivElement>('.season-name')

        // 获取section的边界框
        const sectionRect = sectionRef.current.getBoundingClientRect()
        if (initialSectionHeightRef.current === null) {
            initialSectionHeightRef.current = sectionRect.height
        }
        // 计算「屏幕中心」在 section 坐标系下的位置（将视口中心转为 section 内部坐标）
        const sectionCenterX = window.innerWidth / 2 - sectionRect.left
        const sectionCenterY = window.innerHeight / 2 - sectionRect.top
        // 将 section 顶部对齐到视口顶部所需的位移
        const sectionMoveY = -sectionRect.top

        // 获取点击的stack的初始位置和尺寸
        const clickedRect = clickedStack.getBoundingClientRect()
        const initialX = clickedRect.left - sectionRect.left + clickedRect.width / 2
        const initialY = clickedRect.top - sectionRect.top + clickedRect.height / 2 + 100
        // 纠正初始位置中 class 偏移（up-offset/down-offset），保证四季统一定位
        const appliedOffsetY = clickedStack.classList.contains('up-offset')
            ? -100
            : clickedStack.classList.contains('down-offset')
            ? 100
            : 0
        const correctedInitialY = initialY - appliedOffsetY

        // 计算需要移动的距离（目标为“section 上移后”仍落在视口中心）
        const deltaX = sectionCenterX - initialX
        const deltaY = sectionCenterY - correctedInitialY - sectionMoveY

        // 先淡出标题+上移 section，再让 stack 放大到中心，然后再展开 l1 / l3
        const tl = gsap.timeline({
            defaults: { duration: 1.0, ease: 'linear' },
            onComplete: () => {
                setIsAnimating(false)
                setCanGoBack(true) // 展开完成后才允许返回 & 显示按钮
            },
        })

        // Header 渐隐
        tl.to(
            [titleRef.current, headerSubRef.current].filter(Boolean),
            { opacity: 0, duration: 0.4, ease: 'power2.inOut' },
            0
        )

        // Section 上移
        tl.to(
            sectionRef.current,
            {
                y: sectionMoveY,
                height: window.innerHeight,
                duration: 0.6,
                ease: 'power2.inOut',
            },
            0
        )

        // 渐隐 stack 内部的 season-name
        if (seasonLabel) {
            tl.to(
                seasonLabel,
                {
                    opacity: 0,
                },
                0
            )
        }

        // 渐显右上角季节标题
        if (seasonTitleRef.current) {
            tl.to(
                seasonTitleRef.current,
                {
                    opacity: 1,
                },
                0
            )
        }

        // 先抵消初始 up/down offset，保证以零偏移为基准居中
        tl.set(
            clickedStack,
            {
                y: -appliedOffsetY,
            },
            0
        )

        tl.to(clickedStack, {
            x: deltaX,
            y: deltaY,
            scale: 1.5,
            zIndex: 10,
            ease: 'linear',
        })

        // 第二段：层展开（l1 左移，l3 右移）——使用 xPercent，偏移相对于自身宽度
        tl.addLabel('spread')
        if (topLayer) {
            tl.to(
                topLayer,
                {
                    xPercent: -40,
                    ease: 'power2.inOut',
                },
                'spread'
            )
        }
        if (bottomLayer) {
            tl.to(
                bottomLayer,
                {
                    xPercent: 40,
                    ease: 'power2.inOut',
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
                    duration: 1.0,
                    ease: 'power2.inOut',
                    delay: index * 0.1,
                })
            }
        })
    }

    const handleBackClick = () => {
        // 只有在展开完成且当前没有其他动画时才能返回
        if (isAnimating || !selectedSeason || !canGoBack) return

        const selectedStack = seasonRefs.current[selectedSeason]
        if (!selectedStack) return

        // 立即隐藏二级标题/副标题，避免与一级叠显示
        if (seasonTitleRef.current) gsap.set(seasonTitleRef.current, { opacity: 0 })
        const seasonSubNow = document.querySelector<HTMLDivElement>('.season-top-sub')
        if (seasonSubNow) gsap.set(seasonSubNow, { opacity: 0 })

        const topLayer = selectedStack.querySelector<HTMLDivElement>('.l1')
        const bottomLayer = selectedStack.querySelector<HTMLDivElement>('.l3')
        // 如果当前在三级画面（单个 layer 被选中），先回到二级画面：恢复该 layer 的 scale，其它 layer 重新出现
        if (selectedLayer !== null) {
            setIsAnimating(true)

            const focused = selectedStack.querySelector<HTMLDivElement>(
                `.l${selectedLayer}`
            )
            const l1 = selectedStack.querySelector<HTMLDivElement>('.l1')
            const l2 = selectedStack.querySelector<HTMLDivElement>('.l2')
            const l3 = selectedStack.querySelector<HTMLDivElement>('.l3')

            if (!focused || !l1 || !l2 || !l3) return

            const tl = gsap.timeline({
                defaults: { duration: 0.8, ease: 'power2.inOut' },
                onComplete: () => {
                    setSelectedLayer(null)
                    setIsAnimating(false)
                },
            })

            // 恢复被选中的 layer 的 zIndex 为其原始层级
            const originalZ =
                focused.classList.contains('l1') ? 3 : focused.classList.contains('l2') ? 2 : 1

            tl.to(
                focused,
                {
                    scale: 1,
                    zIndex: originalZ,
                    y:
                        selectedLayer === 1
                            ? '-=100'
                            : selectedLayer === 3
                            ? '+=100'
                            : '+=0',
                    x:
                        selectedLayer === 1
                            ? '-=200'
                            : selectedLayer === 3
                            ? '+=200'
                            : '+=0',
                },
                0
            )

            // 所有layer恢复可见和可交互
            tl.to(
                [l1, l2, l3],
                {
                    opacity: 1,
                    pointerEvents: 'auto',
                },
                0
            )

            return
        }

        // 否则当前在二级画面，执行原有逻辑：合拢 layer，然后整个 stack 回到初始位置
        setIsAnimating(true)
        setCanGoBack(false)

        const seasonLabel = selectedStack.querySelector<HTMLDivElement>('.season-name')

        const tl = gsap.timeline({
            defaults: { duration: 1.0, ease: 'power2.inOut' },
            onComplete: () => {
                // 清理层上的 xPercent 偏移，完全回到 CSS 初始状态
                if (topLayer) gsap.set(topLayer, { clearProps: 'xPercent' })
                if (bottomLayer) gsap.set(bottomLayer, { clearProps: 'xPercent' })

                // 清理所有 season-stack 的内联 transform，恢复 up/down offset 与 hover
                SEASONS.forEach((seasonKey) => {
                    const stackEl = seasonRefs.current[seasonKey]
                    if (stackEl) {
                        gsap.set(stackEl, { clearProps: 'transform' })
                    }
                })

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

        // 渐显 stack 内的 season-name
        if (seasonLabel) {
            tl.to(
                seasonLabel,
                {
                    opacity: 1,
                },
                0
            )
        }

        // 渐隐右上角季节标题
        if (seasonTitleRef.current) {
            tl.to(
                seasonTitleRef.current,
                {
                    opacity: 0,
                },
                0
            )
        }
        // 渐隐右上角季节副标题
        const seasonSubBack = document.querySelector<HTMLDivElement>('.season-top-sub')
        if (seasonSubBack) {
            tl.to(
                seasonSubBack,
                {
                    opacity: 0,
                },
                0
            )
        }
        // 渐隐右上角季节副标题
        const seasonSubHide = document.querySelector<HTMLDivElement>('.season-top-sub')
        if (seasonSubHide) {
            tl.to(
                seasonSubHide,
                {
                    opacity: 0,
                },
                0
            )
        }

        // 第二步：当前 stack 回到零偏移基准位置
        tl.to(selectedStack, {
            x: 0,
            y: 0,
            scale: 1,
            zIndex: 1,
            ease: 'power1.inOut',
        })

        // 第三步：四个 stack 同步滑回各自 offset（含 up/down）
        const allStacks = SEASONS.map((s) => seasonRefs.current[s]).filter(Boolean) as HTMLDivElement[]
        tl.to(
            allStacks,
            {
                y: (_i, target) =>
                    target.classList.contains('up-offset')
                        ? -100
                        : target.classList.contains('down-offset')
                        ? 100
                        : 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power2.inOut',
            },
            '>-0.1'
        )

        // Section 下移复位
        tl.to(
            sectionRef.current,
            {
                y: 0,
                height: initialSectionHeightRef.current ?? 'auto',
                duration: 0.6,
                ease: 'power2.inOut',
            },
            '>-0.1'
        )

        // 清理 height，回归自适应
        tl.add(() => {
            if (sectionRef.current) gsap.set(sectionRef.current, { clearProps: 'height' })
        })

        // Header 渐显
        tl.to(
            [titleRef.current, headerSubRef.current].filter(Boolean),
            { opacity: 1, duration: 0.4, ease: 'power1.in' },
            '>-0.2'
        )
    }

    // ===== Layer hover：在放大后的视图里，悬浮单层轻微放大 =====
    const handleLayerHover = (season: string, layerIndex: number, isEnter: boolean, target?: HTMLElement | null, texIndex?: number) => {
        // 只有当前被放大的 season-stack，且整体动画已完成时才响应 hover
        if (!selectedSeason || season !== selectedSeason) return
        if (!canGoBack || isAnimating) return

        const stack = seasonRefs.current[season]
        if (!stack) return

        const layer = stack.querySelector<HTMLDivElement>(`.l${layerIndex}`)
        if (!layer) return

        // 三级界面：只高亮当前层的当前切片，其它保持黑色
        if (selectedLayer !== null) {
            if (selectedLayer !== layerIndex) return
            const segments = layer.querySelectorAll<HTMLDivElement>('.layer-segment')
            segments.forEach((seg) => {
                seg.style.border = '0.2px solid #000000'
                seg.style.boxShadow = 'inset 0 0 0 0.2px #000000'
            })
            if (isEnter && target) {
                target.style.border = '0.2px solid #0040FF'
                target.style.boxShadow = 'inset 0 0 0 0.2px #0040FF'

                // Tooltip 数据
                const seasonKey = season.toLowerCase() as Season
                const data = getLayerData(seasonKey, layerIndex as 1 | 2 | 3, texIndex || 1)
                if (data) {
                    const rect = target.getBoundingClientRect()
                    let pos = { x: rect.left, y: rect.top }
                    if ((texIndex || 1) === 1) {
                        pos = { x: rect.left - 160, y: rect.top - 60 }
                    } else if ((texIndex || 1) === 2) {
                        pos = { x: rect.right - 150, y: rect.top - 60 }
                    } else {
                        pos = { x: rect.right - 70, y: rect.bottom - 100 }
                    }
                    setSliceTooltip({
                        name: data.name,
                        intro: data.introduction,
                        pos,
                        anchor: { x: pos.x, y: pos.y }, // placeholder, not used now
                        texIndex: texIndex || 1,
                    })
                }
            }
            if (!isEnter) setSliceTooltip(null)
            return
        }

        // 二级界面：保持原有轻微放大
        gsap.to(layer, {
            scale: isEnter ? 1.15 : 1,
            duration: 0.6,
            ease: 'power2.out',
        })
        if (!isEnter) setSliceTooltip(null)
    }

    // ===== Layer click：从二级画面进入三级画面，或从三级画面进入四级画面 =====
    const handleLayerClick = (season: string, layerIndex: number, texIndex:number = 1) => {
        // 如果已经在三级画面，且点击的是当前选中的layer，则进入四级界面
        if (selectedLayer === layerIndex && selectedSeason === season) {
            setShowLayerDetail(true)
            setSelectedTexIndex(texIndex)
            return
        }

        // 只在当前被放大的 season-stack，且动画完成的二级画面中响应点击
        if (!selectedSeason || season !== selectedSeason) return
        if (!canGoBack || isAnimating) return
        if (selectedLayer !== null) return

        const stack = seasonRefs.current[season]
        if (!stack) return

        const clickedLayer = stack.querySelector<HTMLDivElement>(`.l${layerIndex}`)
        if (!clickedLayer) return

        const otherLayers = [1, 2, 3]
            .filter((i) => i !== layerIndex)
            .map((i) => stack.querySelector<HTMLDivElement>(`.l${i}`))
            .filter((el): el is HTMLDivElement => !!el)

        setIsAnimating(true)
        setSelectedTexIndex(texIndex)

        const tl = gsap.timeline({
            defaults: { duration: 1.0, ease: 'power2.inOut' },
            onComplete: () => {
                setIsAnimating(false)
                setSelectedLayer(layerIndex)
            },
        })

        // 点击的 layer 放大到 2 倍（只保留缩放，不移动位置）
        tl.to(
            clickedLayer,
            {
                scale: 1.5,
                zIndex: 20,
                y: layerIndex === 1 ? '+=100' : layerIndex === 3 ? '-=100' : '+=0',
                x: layerIndex === 1 ? '+=200' : layerIndex === 3 ? '-=200' : '+=0',
            },
            0
        )

        // 其他两层淡出并禁用交互
        if (otherLayers.length) {
            tl.to(
                otherLayers,
                {
                    opacity: 0,
                    pointerEvents: 'none',
                },
                0
            )
        }
    }

    // 关闭四级界面
    const handleCloseLayerDetail = () => {
        setShowLayerDetail(false)
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
                <div className="season-top-title" ref={seasonTitleRef}>
                    {selectedSeason ? selectedSeason.toUpperCase() : ''}
                </div>
                <div
                    className="season-top-sub"
                    style={{ opacity: selectedSeason && canGoBack ? 1 : 0 }}
                >
                    {selectedSeason === 'SPRING' && 'The most characteristic geological features'}
                    {selectedSeason === 'SUMMER' && 'Reshaping driven by moisture and surface movement'}
                    {selectedSeason === 'AUTUMN' && 'The re-emergence of sediment as activity subsides'}
                    {selectedSeason === 'WINTER' && 'The exposure of physical structures'}
                </div>
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
                            className={`season-stack season-${season.toLowerCase()}${(['SUMMER','WINTER'].includes(season) ? ' up-offset' : ['SPRING','AUTUMN'].includes(season) ? ' down-offset' : '')}`}
                            ref={(el) => { seasonRefs.current[season] = el }}
                            onClick={() => handleSeasonClick(season)}
                        >
                            <div className="layers">
                                <div className="layer l1" style={{display: 'flex', flexDirection: 'row', gap: 2}}>
                                    {selectedSeason === season && selectedLayer === null && (
                                        <div className="layer-label label-l1">
                                            SURFACE<br />INTERACTION
                                        </div>
                                    )}
                                    {(sliceMap[`${season}-1`] || ['/coast-layers/textures/default_white.png']).map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="layer-segment"
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                                minHeight: 0,
                                                backgroundImage: `url(${img})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat',
                                                borderRadius: 0,
                                                border: 'none',
                                                transition: 'transform 0.2s',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => { if (selectedSeason===season) e.stopPropagation(); handleLayerHover(season,1,true, e.currentTarget, idx+1) }}
                                            onMouseLeave={e => { if (selectedSeason===season) e.stopPropagation(); handleLayerHover(season,1,false, e.currentTarget, idx+1) }}
                                            onClick={e => { if (selectedSeason===season) e.stopPropagation(); handleLayerClick(season,1, idx+1) }}
                                        />
                                    ))}
                                </div>
                                <div className="layer l2" style={{display: 'flex', flexDirection: 'row', gap: 2}}>
                                    {selectedSeason === season && selectedLayer === null && (
                                        <div className="layer-label label-l2">
                                            TIDAL<br />REWORKING
                                        </div>
                                    )}
                                    {(sliceMap[`${season}-2`] || ['/coast-layers/textures/default_white.png']).map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="layer-segment"
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                                minHeight: 0,
                                                backgroundImage: `url(${img})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat',
                                                borderRadius: 0,
                                                border: 'none',
                                                transition: 'transform 0.2s',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => { if (selectedSeason===season) e.stopPropagation(); handleLayerHover(season,2,true, e.currentTarget, idx+1) }}
                                            onMouseLeave={e => { if (selectedSeason===season) e.stopPropagation(); handleLayerHover(season,2,false, e.currentTarget, idx+1) }}
                                            onClick={e => { if (selectedSeason===season) e.stopPropagation(); handleLayerClick(season,2, idx+1) }}
                                        />
                                    ))}
                                </div>
                                <div className="layer l3" style={{display: 'flex', flexDirection: 'row', gap: 2}}>
                                    {selectedSeason === season && selectedLayer === null && (
                                        <div className="layer-label label-l3">
                                            DEPOSITIONAL<br />ARCHIVE
                                        </div>
                                    )}
                                    {(sliceMap[`${season}-3`] || ['/coast-layers/textures/default_white.png']).map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="layer-segment"
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                                minHeight: 0,
                                                backgroundImage: `url(${img})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat',
                                                borderRadius: 0,
                                                border: 'none',
                                                transition: 'transform 0.2s',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => { if (selectedSeason===season) e.stopPropagation(); handleLayerHover(season,3,true, e.currentTarget, idx+1) }}
                                            onMouseLeave={e => { if (selectedSeason===season) e.stopPropagation(); handleLayerHover(season,3,false, e.currentTarget, idx+1) }}
                                            onClick={e => { if (selectedSeason===season) e.stopPropagation(); handleLayerClick(season,3, idx+1) }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="season-name">{season}                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== Layer Detail (四级界面) ===== */}
            {sliceTooltip && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            left: sliceTooltip.pos.x,
                            top: sliceTooltip.pos.y,
                            color: '#0040FF',
                            fontSize: 32,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            lineHeight: 1.2,
                            zIndex: 999,
                            pointerEvents: 'none',
                            textDecoration: 'underline',
                            transform: 'rotateX(45deg) rotateZ(45deg',
                        }}
                    >
                        {sliceTooltip.name}
                        <div
                            style={{
                                textDecoration: 'none',
                                marginTop: 4,
                                textTransform: 'capitalize',
                                fontSize: 20,
                                letterSpacing: '0.05em',
                                
                            }}
                        >
                            {sliceTooltip.intro.toLowerCase()}
                        </div>
                    </div>
                    {(() => {
                        // 可调的连线起点相对文本框的偏移（单位：px）
                        const lineOffsetMap: Record<number, { dx: number; dy: number }> = {
                            1: { dx: 400, dy: 50 },
                            2: { dx: 100, dy: 30 },
                            3: { dx: 0, dy: -100 },
                        }
                        const lineOffset = lineOffsetMap[sliceTooltip.texIndex] || lineOffsetMap[1]
                        return (
                    <div
                        style={{
                            position: 'fixed',
                            left: sliceTooltip.pos.x + lineOffset.dx,
                            top: sliceTooltip.pos.y + lineOffset.dy,
                            width: 2,
                            height: 100,
                            backgroundColor: '#0040FF',
                            transformOrigin: 'center center',
                            transform:
                                sliceTooltip.texIndex === 1
                                    ? 'rotateX(0deg) rotateY(0deg) rotateZ(-55deg)'
                                    : sliceTooltip.texIndex === 2
                                    ? 'rotateX(0deg) rotateY(0deg) rotateZ(56deg)'
                                    : 'rotateX(0deg) rotateY(0deg) rotate(125deg)',
                            zIndex: 998,
                            pointerEvents: 'none',
                        }}
                    />
                        )
                    })()}
                </>
            )}
            {showLayerDetail && selectedSeason && selectedLayer !== null && (
                <LayerDetail
                    season={selectedSeason.toLowerCase() as 'spring' | 'summer' | 'autumn' | 'winter'}
                    layerIndex={selectedLayer as 1 | 2 | 3}
                    texIndex={selectedTexIndex}
                    onClose={handleCloseLayerDetail}
                />
            )}
        </div>
    )
}
