// 点云数据解析与工具函数

// 解析通用点云 txt 格式
export function parsePointCloud(content) {
  const lines = content.trim().split('\n')
  const points = []
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/)
    if (parts.length >= 3) {
      const x = parseFloat(parts[0])
      const y = parseFloat(parts[1])
      const z = parseFloat(parts[2])
      let r = 255, g = 255, b = 255
      if (parts.length >= 6) {
        r = parseFloat(parts[3])
        g = parseFloat(parts[4])
        b = parseFloat(parts[5])
      }
      if (!isNaN(x) && !isNaN(y) && !isNaN(z) && isFinite(x) && isFinite(y) && isFinite(z)) {
        points.push({ x, y, z, r, g, b })
      }
    }
  })
  return points
}

// 解析 PLY (ASCII) 格式
export function parsePLY(content) {
  const lines = content.split('\n')
  let headerEnded = false
  let vertexCount = 0
  let points = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!headerEnded) {
      if (line.startsWith('element vertex')) {
        vertexCount = parseInt(line.split(' ')[2])
      }
      if (line === 'end_header') {
        headerEnded = true
      }
    } else {
      if (points.length < vertexCount && line.length > 0) {
        const parts = line.split(/\s+/).map(Number)
        let [x, y, z, r = 255, g = 255, b = 255] = parts
        if (
          typeof x === 'number' && typeof y === 'number' && typeof z === 'number' &&
          !isNaN(x) && !isNaN(y) && !isNaN(z) &&
          isFinite(x) && isFinite(y) && isFinite(z)
        ) {
          points.push({ x, y, z, r, g, b })
        }
      }
    }
  }
  return points
}

// 计算点云包围盒
export function calculateBoundingBox(points) {
  const bbox = {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity }
  }
  points.forEach(point => {
    bbox.min.x = Math.min(bbox.min.x, point.x)
    bbox.min.y = Math.min(bbox.min.y, point.y)
    bbox.min.z = Math.min(bbox.min.z, point.z)
    bbox.max.x = Math.max(bbox.max.x, point.x)
    bbox.max.y = Math.max(bbox.max.y, point.y)
    bbox.max.z = Math.max(bbox.max.z, point.z)
  })
  return bbox
}

// 导出点云为 txt
export function exportPointCloudTxt(points) {
  if (!points || points.length === 0) return
  const lines = points.map(pt => [pt.x, pt.y, pt.z, pt.r, pt.g, pt.b].join(' ')).join('\n')
  const blob = new Blob([lines], { type: 'text/plain' })
  const link = document.createElement('a')
  link.download = 'pointcloud.txt'
  link.href = URL.createObjectURL(blob)
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

// 导出点云为 PLY (ASCII)
export function exportPointCloudPLY(points) {
  if (!points || points.length === 0) return
  let header = `ply\nformat ascii 1.0\nelement vertex ${points.length}\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nend_header\n`
  const lines = points.map(pt => [pt.x, pt.y, pt.z, Math.round(pt.r), Math.round(pt.g), Math.round(pt.b)].join(' ')).join('\n')
  const content = header + lines
  const blob = new Blob([content], { type: 'text/plain' })
  const link = document.createElement('a')
  link.download = 'pointcloud.ply'
  link.href = URL.createObjectURL(blob)
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}