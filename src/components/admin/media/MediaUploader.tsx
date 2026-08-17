'use client'

import { useState } from 'react'
import { UploadCloud } from 'lucide-react'

export default function MediaUploader() {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log('Files dropped:', e.dataTransfer.files)
      // Implementation of upload will go here
    }
  }

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${
        isDragging ? 'border-amf-teal-400 bg-amf-ivory-100' : 'border-amf-border bg-amf-creme hover:bg-amf-ivory-100'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="h-12 w-12 bg-amf-surface rounded-full flex items-center justify-center mb-4 shadow-sm text-amf-teal-400">
        <UploadCloud size={24} />
      </div>
      <p className="text-amf-plum font-medium mb-1">Click to upload or drag and drop</p>
      <p className="text-amf-muted text-sm text-center">
        SVG, PNG, JPG or GIF (max. 10MB)
      </p>
    </div>
  )
}
