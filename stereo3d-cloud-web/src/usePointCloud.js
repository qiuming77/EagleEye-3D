import { useState, useEffect } from 'react'
import { parsePointCloud, parsePLY, exportPointCloudTxt, exportPointCloudPLY } from './pointCloudUtils'
import { PLYLoader } from 'three-stdlib';

export default function usePointCloud({ cloudUrl, canvasRef, fullscreenContainerRef }) {
  const [pointSize, setPointSize] = useState(0.05)
  const [colorMode, setColorMode] = useState('original')
  const [uniformColor, setUniformColor] = useState('#ffffff')
  const [pointCount, setPointCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [originalData, setOriginalData] = useState([])
  const [showControls, setShowControls] = useState(true)
  const [error, setError] = useState(null)

  // 处理文件/URL 加载
  const handleCloudData = (eventOrData) => {
    console.log('handleCloudData called with:', eventOrData);
    if (!eventOrData) {
      console.warn('handleCloudData: eventOrData is undefined or null');
      return;
    }
    if (typeof eventOrData === 'object' && eventOrData.target && eventOrData.target.files) {
      const file = eventOrData.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      if (file.name.endsWith('.ply')) {
        reader.onload = (e) => {
          const buffer = e.target.result;
          const loader = new PLYLoader();
          let geometry;
          try {
            geometry = loader.parse(buffer);
          } catch (err) {
            alert('PLY 解析失败：' + err.message);
            setOriginalData([]);
            setPointCount(0);
            return;
          }
          geometry.computeVertexNormals && geometry.computeVertexNormals();
          const pos = geometry.attributes.position;
          const colorAttr = geometry.attributes.color;
          const points = [];
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
            let r = 255, g = 255, b = 255;
            if (colorAttr) {
              r = Math.round(colorAttr.getX(i) * 255);
              g = Math.round(colorAttr.getY(i) * 255);
              b = Math.round(colorAttr.getZ(i) * 255);
            }
            points.push({ x, y, z, r, g, b });
          }
          setOriginalData(points);
          setPointCount(points.length);
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (e) => {
          const points = parsePointCloud(e.target.result);
          setOriginalData(points);
          setPointCount(points.length);
        };
        reader.readAsText(file);
      }
    } else if (Array.isArray(eventOrData)) {
      // 直接传入点云数组
      console.log('Direct point cloud array:', eventOrData)
      setOriginalData(eventOrData)
      setPointCount(eventOrData.length)
    } else {
      console.warn('handleCloudData: unknown data type', eventOrData)
    }
  }

  // 支持通过 cloudUrl 自动加载点云
  useEffect(() => {
    if (!cloudUrl) return
    if (cloudUrl.endsWith('.ply')) {
      fetch(cloudUrl)
        .then(res => res.arrayBuffer())
        .then(buffer => {
          const loader = new PLYLoader();
          let geometry;
          try {
            geometry = loader.parse(buffer);
          } catch (err) {
            setError('PLY 解析失败: ' + err.message);
            setOriginalData([]);
            setPointCount(0);
            return;
          }
          geometry.computeVertexNormals && geometry.computeVertexNormals();
          const pos = geometry.attributes.position;
          const colorAttr = geometry.attributes.color;
          const points = [];
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
            let r = 255, g = 255, b = 255;
            if (colorAttr) {
              r = Math.round(colorAttr.getX(i) * 255);
              g = Math.round(colorAttr.getY(i) * 255);
              b = Math.round(colorAttr.getZ(i) * 255);
            }
            points.push({ x, y, z, r, g, b });
          }
          setOriginalData(points);
          setPointCount(points.length);
        })
        .catch(e => setError('点云加载失败: ' + e.message));
    } else {
      fetch(cloudUrl)
        .then(res => res.text())
        .then(text => {
          const points = parsePointCloud(text)
          setOriginalData(points)
          setPointCount(points.length)
        })
        .catch(e => setError('点云加载失败: ' + e.message))
    }
  }, [cloudUrl])

  // 导出点云
  const exportPointCloud = (format = 'txt') => {
    if (format === 'ply') {
      exportPointCloudPLY(originalData)
    } else {
      exportPointCloudTxt(originalData)
    }
  }

  // 重置相机
  const resetCamera = () => {
    canvasRef.current && canvasRef.current.resetCamera && canvasRef.current.resetCamera()
  }

  // 全屏
  const toggleFullscreen = () => {
    if (fullscreenContainerRef && fullscreenContainerRef.current) {
      if (!document.fullscreenElement) {
        fullscreenContainerRef.current.requestFullscreen && fullscreenContainerRef.current.requestFullscreen()
      } else {
        document.exitFullscreen && document.exitFullscreen()
      }
    } else if (canvasRef.current && canvasRef.current.toggleFullscreen) {
      canvasRef.current.toggleFullscreen()
    }
  }

  return {
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
  }
}