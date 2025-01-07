import { useId, useState } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import toast from 'react-hot-toast'
import { FaCropAlt, FaUpload } from 'react-icons/fa'

import { FileUpload, useFileUpload } from '@ark-ui/react/file-upload'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@otog/ui'

import { avatarKey } from '../api/query'
import { useUserContext } from '../context/user-context'
import { storage } from '../firebase'

interface AvatarUploadProps {
  userId: number
}

export const AvatarUpload = (props: AvatarUploadProps) => {
  const { user } = useUserContext()
  const avatarUrlQuery = useQuery(
    avatarKey.getUrl({ userId: props.userId, size: 'default' })
  )
  const avatarUrl = avatarUrlQuery.data

  const fileUpload = useFileUpload({
    id: useId(),
    maxFiles: 1,
    accept: { images: ['.c', '.cc', '.cpp', '.py'] },
    onFileChange: (details) => {
      const file = details.acceptedFiles[0]
      onFileSelect(file)
    },
  })

  const onFileSelect = async (file: File | undefined) => {
    if (!file) return
    try {
      const image = await createImageFromFile(file)
      const croppedImage = await getCroppedImage(image)
      if (croppedImage) {
        onUpload(croppedImage)
      }
    } catch (e: any) {
      console.error(e)
    }
  }

  const queryClient = useQueryClient()
  const onUpload = (file: File) => {
    if (user) {
      const uploadTask = storage
        .ref(`images/${user.id}.jpeg`)
        .put(file, { contentType: 'image/jpeg' })
      uploadTask.on(
        'state_changed',
        () => {
          // const progress = Math.round(
          //   (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          // )
          // setProgress(progress)
        },
        (error) => console.error(error),
        () => {
          avatarUrlQuery.refetch()
          toast.success(
            <div>
              <b>อัปโหลดรูปสำเร็จ!</b>
              <p>กดรีเฟรชหากรูปของคุณยังไม่เปลี่ยน</p>
            </div>,
            { duration: 4000 }
          )
          setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: avatarKey.getUrl({ userId: user.id, size: 'small' }),
            })
          }, 1000)
        }
      )
    }
  }

  //   const confirm = useConfirmModal()
  //   const onRemove = () => {
  //     if (!user) {
  //       return
  //     }
  //     confirm({
  //       cancleText: 'ยกเลิก',
  //       submitText: 'ยืนยัน',
  //       title: 'ยืนยันลบโปรไฟล์',
  //       subtitle: 'คุณยืนยันที่จะลบรูปโปรไฟล์ของคุณหรือไม่',
  //       onSubmit: async () => {
  //         try {
  //           await Promise.all([
  //             storage.ref(`images/${user.id}.jpeg`).delete(),
  //             storage.ref(`images/${user.id}_32.jpeg`).delete(),
  //           ])
  //           reloadBigAvatar()
  //         //   reloadSmallAvatar()
  //         } catch {}
  //       },
  //     })
  //   }

  return (
    <>
      <div className="absolute inset-0 bg-black/15 invisible group-hover:visible" />

      {avatarUrl && (
        <div className="invisible absolute top-1 right-1 flex gap-2 group-hover:visible">
          <Button
            size="icon"
            variant="secondary"
            aria-label="remove-profile-picture"
            // onClick={onRemove}
          >
            <XMarkIcon />
          </Button>
        </div>
      )}
      <div className="invisible absolute top-1/2 right-1/2 flex translate-x-1/2 -translate-y-1/2 gap-2 group-hover:visible">
        <FileUpload.RootProvider value={fileUpload}>
          <FileUpload.HiddenInput />
          <FileUpload.Dropzone tabIndex={-1}>
            <Button size="sm" variant="secondary">
              <FaUpload />
              อัปโหลด
            </Button>
          </FileUpload.Dropzone>
        </FileUpload.RootProvider>
        {avatarUrl && <ImageCropModal userId={props.userId} />}
      </div>
    </>
  )
}

// ref: https://codesandbox.io/s/q8q1mnr01w
export const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

export const createImageFromFile = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const fileReader = new FileReader()
    fileReader.onload = (event) => {
      image.src = event.target?.result as string
    }
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    fileReader.readAsDataURL(file)
  })

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 * @param {File} image - Image File url
 * @param {Object} pixelCrop - pixelCrop Object provided by react-easy-crop
 * @param {number} rotation - optional rotation parameter
 */
const BOX_SIZE = 320 * 2
export async function getCroppedImage(
  image: HTMLImageElement,
  sourceArea?: Area
) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (context) {
    if (sourceArea) {
      canvas.width = BOX_SIZE
      canvas.height = BOX_SIZE

      context.drawImage(
        image,
        sourceArea.x,
        sourceArea.y,
        sourceArea.width,
        sourceArea.height,
        0,
        0,
        BOX_SIZE,
        BOX_SIZE
      )
    } else {
      const sWidth = image.naturalWidth
      const sHeight = image.naturalHeight
      const size = Math.min(sWidth, sHeight)
      const dWidth = (sWidth / size) * BOX_SIZE
      const dHeight = (sHeight / size) * BOX_SIZE
      canvas.width = dWidth
      canvas.height = dHeight
      context.drawImage(image, 0, 0, sWidth, sHeight, 0, 0, dWidth, dHeight)
    }

    // As a blob
    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob && new File([blob], 'tmp.jpeg'))
      }, 'image/jpeg')
    })
  }
  throw new Error(`This browser doesn't support 2D Context`)
}

interface ImageUploadModalProps {
  userId: number
}
export const ImageCropModal = (props: ImageUploadModalProps) => {
  const [open, setOpen] = useState(false)
  const { user } = useUserContext()
  const avatarUrlQuery = useQuery(
    avatarKey.getUrl({ userId: props.userId, size: 'default' })
  )
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>()
  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const queryClient = useQueryClient()
  const uploadCroppedImage = async () => {
    if (!user || !avatarUrlQuery.data || !croppedAreaPixels) return
    try {
      const image = await createImage(avatarUrlQuery.data)
      const croppedImage = await getCroppedImage(image, croppedAreaPixels)
      if (croppedImage) {
        const uploadTask = storage
          .ref(`images/${user.id}.jpeg`)
          .put(croppedImage, { contentType: 'image/jpeg' })
        uploadTask.on(
          'state_changed',
          () => {
            // const progress = Math.round(
            //   (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            // )
            // setProgress(progress)
          },
          (error) => {
            console.error(error)
          },
          () => {
            avatarUrlQuery.refetch()
            setOpen(false)
            setZoom(1)
            setCrop({ x: 0, y: 0 })
            setTimeout(() => {
              queryClient.invalidateQueries({
                queryKey: avatarKey.getUrl({ userId: user.id, size: 'small' }),
              })
            }, 1000)
          }
        )
      }
    } catch (e: any) {
      console.error(e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <FaCropAlt />
          ตัดภาพ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>ตัดภาพ</DialogTitle>
        <div className="flex flex-col gap-2">
          <div className="relative h-[400px] w-full">
            <Cropper
              aspect={1}
              image={avatarUrlQuery.data ?? undefined}
              crop={crop}
              onCropChange={setCrop}
              zoom={zoom}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="round"
            />
          </div>
          <input
            className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-600"
            type="range"
            min={1}
            max={3}
            onChange={(e) => setZoom(Number(e.target.value))}
            value={zoom}
            step={0.01}
          />
        </div>
        <DialogFooter>
          <Button onClick={uploadCroppedImage}>เสร็จสิ้น</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
