import { useRef } from 'react'
import PointCloudCanvas from './PointCloudCanvas'
import PointCloudControls from './PointCloudControls'
import usePointCloud from './usePointCloud'

export default function PointCloudViewer({ cloudUrl, fullscreenContainerRef }) {
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const {
    pointSize, setPointSize,
    colorMode, setColorMode,
    uniformColor, setUniformColor,
    pointCount, setPointCount,
    isAnimating, setIsAnimating,
    originalData, setOriginalData,
    showControls, setShowControls,
    error, setError,
    handleCloudData,
    exportPointCloud,
    resetCamera,
    toggleFullscreen
  } = usePointCloud({ cloudUrl, canvasRef, fullscreenContainerRef })

  return (
    <div
      ref={fullscreenContainerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className="pointcloud-fullscreen-container"
    >
      <PointCloudCanvas
        ref={canvasRef}
        pointSize={pointSize}
        colorMode={colorMode}
        uniformColor={uniformColor}
        isAnimating={isAnimating}
        originalData={originalData}
        setPointCount={setPointCount}
        resetCamera={resetCamera}
        error={error}
        setError={setError}
        cloudUrl={cloudUrl}
        handleCloudData={handleCloudData}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.ply,.pcd"
        onChange={handleCloudData}
        style={{ display: 'none' }}
      />
      <PointCloudControls
        showControls={showControls}
        setShowControls={setShowControls}
        pointSize={pointSize}
        setPointSize={setPointSize}
        colorMode={colorMode}
        setColorMode={setColorMode}
        uniformColor={uniformColor}
        setUniformColor={setUniformColor}
        isAnimating={isAnimating}
        setIsAnimating={setIsAnimating}
        exportPointCloud={exportPointCloud}
        resetCamera={resetCamera}
        toggleFullscreen={toggleFullscreen}
        pointCount={pointCount}
        fileInputRef={fileInputRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 10
        }}
      />
    </div>
  )
}