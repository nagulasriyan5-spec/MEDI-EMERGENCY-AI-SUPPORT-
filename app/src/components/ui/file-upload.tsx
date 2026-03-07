"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Upload, File, X } from "lucide-react"
import "./file-upload.css"

const FileUpload = React.forwardRef<
  HTMLDivElement,
  {
    onFileUpload: (file: File) => void
    file: File | null
    clearFileUpload: () => void
  }
>(({ onFileUpload, file, clearFileUpload }, ref) => {
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0])
    }
  }

  const onButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div
      ref={ref}
      className={cn("file-upload-container", { "drag-active": dragActive })}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {file ? (
        <div className="file-preview">
          <File className="h-12 w-12 text-gray-500" />
          <p className="mt-2 text-sm text-gray-600">{file.name}</p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={clearFileUpload}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="file-upload-form">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
          />
          <Upload className="h-12 w-12 text-gray-400" />
          <p className="mt-4 text-sm text-gray-600">
            Drag and drop your file here, or{" "}
            <Button variant="link" onClick={onButtonClick}>
              browse
            </Button>
          </p>
        </div>
      )}
    </div>
  )
})

FileUpload.displayName = "FileUpload"

export { FileUpload }
