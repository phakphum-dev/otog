import { forwardRef, useId } from 'react'

import {
  FileUpload,
  UseFileUploadProps,
  useFileUpload,
} from '@ark-ui/react/file-upload'

import { Button } from '@otog/ui/button'
import { inputStyles } from '@otog/ui/input'
import { clsx } from '@otog/ui/utils'

export interface FileInputProps extends UseFileUploadProps {
  onChange: (file: File | undefined) => void
}
export const FileInput = forwardRef<HTMLDivElement, FileInputProps>(
  (props, ref) => {
    const fileUpload = useFileUpload({
      id: useId(),
      maxFiles: 1,
      accept: { 'text/plain': ['.c', '.cc', '.cpp', '.py'] },
      onFileChange: (details) => {
        const file = details.acceptedFiles[0]
        props.onChange(file)
      },
      ...props,
    })

    const file = fileUpload.acceptedFiles[0]

    return (
      <FileUpload.RootProvider value={fileUpload} ref={ref}>
        <FileUpload.HiddenInput />
        <FileUpload.Dropzone tabIndex={-1}>
          <div className={clsx(inputStyles({ focus: 'within' }), 'relative')}>
            {fileUpload.dragging ? (
              <span>วางไฟล์ที่นี่</span>
            ) : file ? (
              <div {...fileUpload.getItemNameProps({ file })}>{file.name}</div>
            ) : (
              <span className="text-muted-foreground">ยังไม่ได้เลือกไฟล์</span>
            )}
            <FileUpload.Trigger asChild>
              <Button
                variant="secondary"
                className="absolute right-0 inset-y-0 rounded-l-none -my-px -mr-px"
              >
                ค้นหาไฟล์
              </Button>
            </FileUpload.Trigger>
          </div>
        </FileUpload.Dropzone>
      </FileUpload.RootProvider>
    )
  }
)
FileInput.displayName = 'FileInput'
