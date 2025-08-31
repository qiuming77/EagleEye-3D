import { useState } from 'react'

export default function PointCloudControls({
  showControls,
  setShowControls,
  pointSize,
  setPointSize,
  colorMode,
  setColorMode,
  uniformColor,
  setUniformColor,
  isAnimating,
  setIsAnimating,
  exportPointCloud, // 只用 props 传入的，不要自己再定义
  resetCamera,
  toggleFullscreen,
  pointCount,
  fileInputRef,
  style = {},
}) {
  const [exportFormat, setExportFormat] = useState('txt')

  if (!showControls) return null
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      background: 'rgba(30, 30, 40, 0.95)',
      display: 'flex',
      alignItems: 'center',
      padding: '10px 20px',
      zIndex: 2000,
      color: 'white',
      fontSize: '14px',
      boxSizing: 'border-box',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      ...style // 合并外部 style
    }}>
      <button onClick={() => fileInputRef.current?.click()} style={{ marginRight: 16, padding: '6px 18px', fontWeight: 500 }}>加载文件</button>
      <span style={{ marginRight: 10 }}>点大小</span>
      <input type="range" min="0.01" max="0.1" step="0.01" value={pointSize} onChange={e => setPointSize(parseFloat(e.target.value))} style={{ width: 80, marginRight: 18 }} />
      <span style={{ marginRight: 10 }}>颜色模式</span>
      <select value={colorMode} onChange={e => setColorMode(e.target.value)} style={{ marginRight: 18, padding: '4px 8px' }}>
        <option value="original">原始颜色</option>
        <option value="height">高度着色</option>
        <option value="distance">距离着色</option>
        <option value="uniform">统一颜色</option>
      </select>
      {colorMode === 'uniform' && (
        <input type="color" value={uniformColor} onChange={e => setUniformColor(e.target.value)} style={{ marginRight: 18, width: 32, height: 32, border: 'none', background: 'none' }} />
      )}
      <button onClick={resetCamera} style={{ marginRight: 10, padding: '6px 16px' }}>重置</button>
      <button onClick={() => setIsAnimating(!isAnimating)} style={{ marginRight: 10, padding: '6px 16px' }}>{isAnimating ? '停止' : '旋转'}</button>
      <select
        style={{ marginRight: 10, padding: '4px 8px' }}
        value={exportFormat}
        onChange={e => setExportFormat(e.target.value)}
      >
        <option value="txt">导出TXT</option>
        <option value="ply">导出PLY</option>
      </select>
      <button onClick={() => exportPointCloud(exportFormat)} style={{ marginRight: 10, padding: '6px 16px', fontWeight: 500 }}>导出</button>
      <button onClick={toggleFullscreen} style={{ marginRight: 18, padding: '6px 16px' }}>全屏</button>
      <span style={{ color: '#ccc', fontSize: 13, marginLeft: 'auto', marginRight: 10 }}>点数: {pointCount?.toLocaleString?.() ?? 0}</span>
    </div>
  )
}