import { forwardRef, useId } from 'react'

import * as fileUpload from '@zag-js/file-upload'
import { normalizeProps, useMachine } from '@zag-js/react'

import { Button, cn, inputStyles } from '@otog/ui'

export interface FileInputProps {
  onChange: (file: File | undefined) => void
}
export const FileInput = forwardRef<HTMLDivElement, FileInputProps>(
  (props, ref) => {
    const [state, send] = useMachine(
      fileUpload.machine({
        id: useId(),
        maxFiles: 1,
        accept: { 'text/plain': ['.c', '.cc', '.cpp', '.py'] },
        onFileChange: (details) => {
          const file = details.acceptedFiles[0]
          props.onChange(file)
        },
      })
    )

    const api = fileUpload.connect(state, send, normalizeProps)
    const file = api.acceptedFiles[0]

    return (
      <div {...api.rootProps} ref={ref}>
        <input {...api.hiddenInputProps} />
        <div {...api.dropzoneProps} tabIndex={-1}>
          <div className={cn(inputStyles({ focus: 'within' }), 'relative')}>
            {api.dragging ? (
              <span>วางไฟล์ที่นี่</span>
            ) : file ? (
              <div {...api.getItemNameProps({ file })}>{file.name}</div>
            ) : (
              <span className="text-muted-foreground">ยังไม่ได้เลือกไฟล์</span>
            )}
            <Button
              {...api.triggerProps}
              variant="secondary"
              className="absolute right-0 inset-y-0 rounded-l-none -my-px -mr-px"
            >
              ค้นหาไฟล์
            </Button>
          </div>
        </div>
      </div>
    )
  }
)
FileInput.displayName = 'FileInput'
