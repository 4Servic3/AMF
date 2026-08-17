'use client'

import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

export default function MediaPicker() {
  const [selected, setSelected] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-lg bg-amf-ivory-100 border border-amf-border flex items-center justify-center overflow-hidden">
          {selected ? (
             <div className="w-full h-full bg-amf-teal-300 flex items-center justify-center text-white">Selected</div>
          ) : (
             <ImageIcon className="text-amf-muted" size={24} />
          )}
        </div>
        <div className="flex flex-col gap-2">
           <button 
             onClick={() => setSelected(!selected)}
             className="px-4 py-2 bg-amf-plum text-amf-creme rounded-md text-sm font-medium hover:bg-amf-plum/90 transition-colors cursor-pointer"
           >
             {selected ? 'Change Image' : 'Select Image'}
           </button>
           {selected && (
             <button 
               onClick={() => setSelected(false)}
               className="text-sm text-amf-error hover:underline text-left cursor-pointer"
             >
               Remove
             </button>
           )}
        </div>
      </div>
    </div>
  )
}
