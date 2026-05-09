import { useState, useEffect, useCallback, useRef } from 'react'
import justify from 'justified-layout'
import PhotoGridItem from './PhotoGridItem'
import type { PhotoWithVersions } from '@/utils/photo'

interface PhotoGridProps {
  photos: PhotoWithVersions[]
  albumSlug: string
}

interface BoxDimensions {
  top: number
  left: number
  width: number
  height: number
}

interface GridItem {
  photo: PhotoWithVersions
  dimensions: BoxDimensions
}

function gridOptions(containerWidth: number) {
  if (containerWidth < 600) {
    return {
      containerWidth,
      containerPadding: 0,
    }
  }
  return {
    containerWidth,
    containerPadding: 10,
  }
}

function buildGrid(
  photos: PhotoWithVersions[],
  containerWidth: number,
): GridItem[] {
  const dimensions = photos.map((p) => {
    const original = p.versions.find((v) => v.size === 'original')
    if (!original?.width || !original?.height) return null
    return { height: original.height, width: original.width }
  })

  const validDimensions = dimensions.filter(
    (d): d is { height: number; width: number } => d !== null,
  )

  const result = justify(validDimensions, gridOptions(containerWidth))

  // Map boxes back to photos, skipping photos that had no valid dimensions
  let boxIndex = 0
  const items: GridItem[] = []
  for (const photo of photos) {
    const original = photo.versions.find((v) => v.size === 'original')
    if (!original?.width || !original?.height) continue
    if (boxIndex < result.boxes.length) {
      items.push({
        photo,
        dimensions: result.boxes[boxIndex],
      })
      boxIndex++
    }
  }

  return items
}

export default function PhotoGrid({ photos, albumSlug }: PhotoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)

  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth)
    }
  }, [])

  useEffect(() => {
    updateWidth()

    let timeoutId: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateWidth, 20)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [updateWidth])

  const gridItems = containerWidth ? buildGrid(photos, containerWidth) : []

  // Compute container height from last box
  const lastBox = gridItems.length > 0 ? gridItems[gridItems.length - 1] : null
  const containerHeight = lastBox
    ? lastBox.dimensions.top + lastBox.dimensions.height + 10
    : 0

  return (
    <div
      ref={containerRef}
      className="photo-grid-container"
      style={{
        position: 'relative',
        height: containerWidth ? containerHeight : 'auto',
      }}
    >
      {gridItems.map((item) => (
        <PhotoGridItem
          key={item.photo.id}
          photo={item.photo}
          dimensions={item.dimensions}
          albumSlug={albumSlug}
        />
      ))}
    </div>
  )
}
