# P5.js 效果放置位置指南

## 当前位置
目前 P5.js 效果位于 **Header 和 Season Section 之间**（第 373-376 行）

## 可选位置方案

### 方案 1：放在页面最顶部（Header 之前）
```tsx
<div className="page">
    {/* ===== P5.js Sketch Section ===== */}
    <section className="section">
        <P5Sketch width={800} height={600} />
    </section>
    
    {/* ===== Header ===== */}
    <header className="header">
        ...
    </header>
    
    {/* ===== White Section ===== */}
    <section className="section" ref={sectionRef}>
        ...
    </section>
</div>
```

### 方案 2：放在 Season Section 之后（页面底部）
```tsx
<div className="page">
    {/* ===== Header ===== */}
    <header className="header">
        ...
    </header>

    {/* ===== White Section ===== */}
    <section className="section" ref={sectionRef}>
        ...
    </section>

    {/* ===== P5.js Sketch Section ===== */}
    <section className="section">
        <P5Sketch width={800} height={600} />
    </section>
</div>
```

### 方案 3：全屏显示（覆盖整个页面）
```tsx
<div className="page">
    {/* ===== P5.js Sketch - 全屏 ===== */}
    <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        zIndex: 1 
    }}>
        <P5Sketch width={0} height={0} /> {/* 传入 0 使用窗口尺寸 */}
    </div>
    
    {/* ===== Header ===== */}
    <header className="header" style={{ position: 'relative', zIndex: 2 }}>
        ...
    </header>
    
    {/* ===== White Section ===== */}
    <section className="section" ref={sectionRef} style={{ position: 'relative', zIndex: 2 }}>
        ...
    </section>
</div>
```

### 方案 4：作为背景层（在内容后面）
```tsx
<div className="page">
    {/* ===== P5.js Sketch - 背景层 ===== */}
    <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        zIndex: 0 
    }}>
        <P5Sketch width={0} height={0} />
    </div>
    
    {/* ===== Header ===== */}
    <header className="header" style={{ position: 'relative', zIndex: 1 }}>
        ...
    </header>
    
    {/* ===== White Section ===== */}
    <section className="section" ref={sectionRef} style={{ position: 'relative', zIndex: 1 }}>
        ...
    </section>
</div>
```

### 方案 5：在 Header 内部（作为标题背景）
```tsx
<header className="header">
    {/* ===== P5.js Sketch ===== */}
    <div style={{ marginBottom: '20px' }}>
        <P5Sketch width={800} height={400} />
    </div>
    
    <div className="header-title" ref={titleRef}>
        THROUGH THE LAYERS
    </div>
    <div className="header-sub">
        GEOLOGICAL SECTIONS OF<br />
        SHANGHAI'S COAST
    </div>
</header>
```

### 方案 6：在 Season Section 内部（作为交互背景）
```tsx
<section className="section" ref={sectionRef}>
    {/* ===== P5.js Sketch ===== */}
    <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <P5Sketch width={800} height={600} />
    </div>
    
    {selectedSeason && canGoBack && (
        <button className="back-button" ...>
            Back
        </button>
    )}
    <div className="season-row">
        ...
    </div>
</section>
```

## 调整尺寸和样式

### 自定义尺寸
```tsx
<P5Sketch width={1200} height={800} />
```

### 响应式全屏
```tsx
<P5Sketch width={0} height={0} /> {/* 自动使用窗口尺寸 */}
```

### 添加自定义样式
```tsx
<section className="section" style={{ 
    padding: '20px',
    textAlign: 'center',
    backgroundColor: 'transparent' // 透明背景
}}>
    <P5Sketch width={800} height={600} className="p5-container" />
</section>
```

然后在 CSS 中添加：
```css
.p5-container {
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

## 如何应用

1. 打开 `src/App.tsx`
2. 找到第 373-376 行的 P5Sketch 组件
3. 根据您想要的方案，移动或修改代码
4. 调整 `width` 和 `height` 属性以适合您的设计



