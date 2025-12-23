import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './index.css'

const SEASONS = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']

export default function App() {
    const titleRef = useRef<HTMLDivElement>(null)

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

    return (
        <div className="page">
            {/* ===== Header ===== */}
            <header className="header">
                <div className="header-title" ref={titleRef}>
                    THROUGH THE LAYERS
                </div>
                <div className="header-sub">
                    GEOLOGICAL SECTIONS OF<br />
                    SHANGHAI’S COAST
                </div>
            </header>

            {/* ===== White Section ===== */}
            <section className="section">
                <div className="season-row">
                    {SEASONS.map((season) => (
                        <div key={season} className="season-stack">
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
