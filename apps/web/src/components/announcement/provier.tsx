import { ProviderProps, createContext, useContext } from 'react'

export type AnnouncementProviderProps = { contestId: number | undefined }

export type AnnouncementValueProps = { contestId: number | undefined }

const AnnouncementContext = createContext<AnnouncementValueProps>(
  {} as AnnouncementValueProps
)

export const useAnnouncementContext = () => useContext(AnnouncementContext)
export const AnnouncementProvider = (
  props: ProviderProps<AnnouncementProviderProps>
) => {
  const { children, value } = props
  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  )
}
