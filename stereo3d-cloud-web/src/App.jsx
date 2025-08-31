import { useState, useRef } from 'react'
import './App.css'
import PointCloudViewer from './PointCloudViewer'

// A reusable component for the upload cards
const UploadCard = ({ id, label, preview, onChange }) => (
  <div 
    className={`upload-card ${preview ? 'has-preview' : ''}`}
    style={{ backgroundImage: preview ? `url(${preview})` : undefined }}
  >
    <div className="upload-placeholder">
      <div className="icon">+</div>
      <div className="text">{label}</div>
    </div>
    <input id={id} type="file" accept="image/*" onChange={onChange} />
  </div>
);

// A reusable loading spinner component
const LoadingSpinner = () => (
  <div className="spinner-container">
    <div className="spinner"></div>
  </div>
);

// 全屏点云容器，功能条和画布同处一容器，便于全屏时功能条悬浮
function PointCloudFullScreenWrapper({ cloudUrl }) {
  const containerRef = useRef(null)
  return (
    <div
      ref={containerRef}
      className="pointcloud-fullscreen-container"
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <PointCloudViewer cloudUrl={cloudUrl} fullscreenContainerRef={containerRef} />
    </div>
  )
}

function App() {
  const [leftImg, setLeftImg] = useState(null)
  const [rightImg, setRightImg] = useState(null)
  const [leftPreview, setLeftPreview] = useState('')
  const [rightPreview, setRightPreview] = useState('')

  const [depthUrl, setDepthUrl] = useState('')
  const [cloudUrl, setCloudUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleFileChange = (e, setImage, setPreview) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!leftImg || !rightImg) {
      alert('请选择左右两张图片。')
      return
    }
    setLoading(true)
    setShowResults(true)
    setCloudUrl('')
    setDepthUrl('')

    const formData = new FormData()
    formData.append('left', leftImg)
    formData.append('right', rightImg)

    try {
      const backend = 'http://localhost:5000'
      const res = await fetch(backend + '/upload', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      setDepthUrl(backend + data.depth_url)
      setCloudUrl(backend + data.cloud_url)
    } catch (error) {
      console.error("Upload failed:", error)
      alert("上传或处理失败，请检查后端服务和网络连接。")
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fullscreen-app">
      {/* 网站名称栏 */}
      <div
        style={{
          position: 'fixed',
          top: 18,
          left: 32,
          zIndex: 3000,
          fontWeight: 700,
          fontSize: '2rem',
          color: '#2563eb',
          letterSpacing: '2px',
          fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif',
          userSelect: 'none',
          pointerEvents: 'none'
        }}
      >
        EagleEye 3D
      </div>
      <aside className="left-panel-fixed">
        <div className="upload-panel"
        style={{ marginTop: '64px' }}
        >
          <UploadCard 
            id="left-img-input" 
            label="上传左图" 
            preview={leftPreview} 
            onChange={e => handleFileChange(e, setLeftImg, setLeftPreview)} 
          />
          <UploadCard 
            id="right-img-input" 
            label="上传右图" 
            preview={rightPreview} 
            onChange={e => handleFileChange(e, setRightImg, setRightPreview)} 
          />
          <button onClick={handleUpload} className="generate-btn" disabled={loading || !leftImg || !rightImg}>
            {loading ? '正在生成...' : '开始生成'}
          </button>
        </div>
      </aside>
      <main className="right-main-area">
        <header className="app-header">
        </header>
        <div className="results-grid">
          <div className="result-card big-card">
            <h3>深度图</h3>
            <div className="result-content">
              {loading ? <LoadingSpinner /> : (
                depthUrl ? <img src={depthUrl} alt="深度图" className="depth-map-img" /> :
                <div className="placeholder-text">请上传图片并生成以查看深度图</div>
              )}
            </div>
          </div>
          <div className="result-card big-card">
            <h3>点云预览</h3>
            <div className="result-content">
              {loading ? <LoadingSpinner /> : (
                cloudUrl ? <PointCloudFullScreenWrapper cloudUrl={cloudUrl} /> :
                <div className="placeholder-text">请上传图片并生成以查看点云</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App