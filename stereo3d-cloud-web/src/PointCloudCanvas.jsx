import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three-stdlib'
import { calculateBoundingBox } from './pointCloudUtils'

const PointCloudCanvas = forwardRef((props, ref) => {
  const {
    pointSize,
    colorMode,
    uniformColor,
    isAnimating,
    setIsAnimating, // 新增
    originalData,
    setPointCount,
    error,
    setError,
    cloudUrl,
    handleCloudData
  } = props

  const mountRef = useRef(null)
  const app = useRef({})
  const animatingRef = useRef(isAnimating)

  // three.js 初始化
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // 场景
    const scene = new THREE.Scene()
    // 相机
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setClearColor(0x1a1a2e)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    // 关键：标准化 controls 实例化
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.screenSpacePanning = true // 关键：平移体验更像 meshlab
    controls.enablePan = true
    controls.enableZoom = true
    controls.enableRotate = true
    controls.panSpeed = 1.0
    controls.zoomSpeed = 1.2
    controls.rotateSpeed = 1.0
    controls.minDistance = 1
    controls.maxDistance = 10000
    controls.minPolarAngle = 0
    controls.maxPolarAngle = Math.PI
    controls.minAzimuthAngle = -Infinity
    controls.maxAzimuthAngle = Infinity

    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)

    // 保存到 ref
    app.current = { scene, camera, renderer, controls, mount }

    // 动画循环
    let animationId
    const animate = () => {
      const { scene, controls } = app.current
      const pointCloud = scene.getObjectByName('pointCloud')
      if (pointCloud && animatingRef.current) {
        pointCloud.rotation.y += 0.01
      }
      controls.update()
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }
    animate()

    // meshlab风格中键拖拽
    let dragging = false
    let dragStart = { x: 0, y: 0 }
    let objectStart = new THREE.Vector3()
    let pointCloud = null
    function screenToWorldDelta(dx, dy, camera, renderer) {
      const fov = camera.fov * (Math.PI / 180)
      const dist = camera.position.distanceTo(new THREE.Vector3(0, 0, 0))
      const height = 2 * Math.tan(fov / 2) * dist
      const width = height * renderer.domElement.width / renderer.domElement.height
      return {
        x: -dx / renderer.domElement.width * width,
        y: dy / renderer.domElement.height * height
      }
    }
    function onMouseDown(e) {
      if (e.button === 1) {
        dragging = true
        dragStart = { x: e.clientX, y: e.clientY }
        pointCloud = app.current.scene.getObjectByName('pointCloud')
        if (pointCloud) {
          objectStart = pointCloud.position.clone()
        }
        app.current.controls.enabled = false
        e.preventDefault()
      }
    }
    function onMouseMove(e) {
      if (dragging && pointCloud) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y
        const { x, y } = screenToWorldDelta(dx, dy, app.current.camera, app.current.renderer)
        pointCloud.position.x = objectStart.x + x
        pointCloud.position.y = objectStart.y + y
      }
    }
    function onMouseUp(e) {
      if (e.button === 1 && dragging) {
        dragging = false
        app.current.controls.enabled = true
        pointCloud = null
      }
    }
    const dom = renderer.domElement
    dom.addEventListener('mousedown', onMouseDown)
    dom.addEventListener('mousemove', onMouseMove)
    dom.addEventListener('mouseup', onMouseUp)
    dom.addEventListener('mouseleave', onMouseUp)

    // 窗口自适应
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  // 渲染点云
  useEffect(() => {
    const { scene } = app.current
    if (!scene) return

    // 清理旧点云
    const old = scene.getObjectByName('pointCloud')
    if (old) {
      scene.remove(old)
      old.geometry.dispose()
      old.material.dispose()
    }

    if (!originalData || originalData.length === 0) return

    // 计算包围盒中心和最大半径
    const bbox = calculateBoundingBox(originalData)
    const center = {
      x: (bbox.min.x + bbox.max.x) / 2,
      y: (bbox.min.y + bbox.max.y) / 2,
      z: (bbox.min.z + bbox.max.z) / 2
    }
    let maxRadius = 0
    originalData.forEach(pt => {
      const dx = pt.x - center.x
      const dy = pt.y - center.y
      const dz = pt.z - center.z
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
      if (dist > maxRadius) maxRadius = dist
    })
    const targetRadius = 50 // 球体半径，可根据需求调整
    const scale = maxRadius > 0 ? targetRadius / maxRadius : 1

    // 构建 BufferGeometry
    const positions = new Float32Array(originalData.length * 3)
    const colors = new Float32Array(originalData.length * 3)
    originalData.forEach((pt, i) => {
      positions[i * 3] = (pt.x - center.x) * scale
      positions[i * 3 + 1] = (pt.y - center.y) * scale
      positions[i * 3 + 2] = (pt.z - center.z) * scale
      let color = new THREE.Color()
      if (colorMode === 'original') {
        color.setRGB(pt.r / 255, pt.g / 255, pt.b / 255)
      } else if (colorMode === 'height') {
        const ratio = (pt.y - bbox.min.y) / (bbox.max.y - bbox.min.y || 1)
        color.setHSL(0.7 * (1 - ratio), 1, 0.5)
      } else if (colorMode === 'distance') {
        const d = Math.sqrt(pt.x * pt.x + pt.y * pt.y + pt.z * pt.z)
        const maxD = Math.sqrt(bbox.max.x ** 2 + bbox.max.y ** 2 + bbox.max.z ** 2)
        color.setHSL(0.3 * (1 - d / (maxD || 1)), 1, 0.5)
      } else if (colorMode === 'uniform') {
        color.set(uniformColor)
      } else {
        color.setRGB(1, 1, 1)
      }
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    })
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.PointsMaterial({ size: pointSize, vertexColors: true, sizeAttenuation: true })
    const pointCloud = new THREE.Points(geometry, material)
    pointCloud.name = 'pointCloud'
    scene.add(pointCloud)

    // 添加三维坐标轴辅助线
    const axesHelper = new THREE.AxesHelper(50)
    axesHelper.name = 'axesHelper'
    scene.add(axesHelper)
  }, [originalData, pointSize, colorMode, uniformColor])

  // 全屏和重置相机暴露给父组件
  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      const { camera, controls, scene } = app.current
      const pointCloud = scene.getObjectByName('pointCloud')
      if (pointCloud) {
        const box = new THREE.Box3().setFromObject(pointCloud)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        camera.position.set(center.x, center.y, center.z + maxDim * 2)
        camera.lookAt(center)
        controls && controls.target.copy(center)
        controls && controls.update()
      }
    },
    toggleFullscreen: () => {
      const el = mountRef.current
      if (!document.fullscreenElement) {
        el.requestFullscreen && el.requestFullscreen()
      } else {
        document.exitFullscreen && document.exitFullscreen()
      }
    }
  }), [])

// 保证 animatingRef.current 始终和 isAnimating 同步
useEffect(() => {
  animatingRef.current = isAnimating
}, [isAnimating])

// 监听空格键切换旋转（仅绑定 document，兼容全屏和初始）
useEffect(() => {
  const handleKeyDown = (e) => {
    // 只响应空格且不在输入框等控件上
    if (e.code === 'Space' && !(e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable))) {
      e.preventDefault()
      setIsAnimating && setIsAnimating(prev => !prev)
    }
  }
  document.addEventListener('keydown', handleKeyDown)
  return () => {
    document.removeEventListener('keydown', handleKeyDown)
  }
}, [setIsAnimating])

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', background: '#1a1a2e' }} />
  )
})

export default PointCloudCanvas