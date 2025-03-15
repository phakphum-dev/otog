import { Link } from '@otog/ui/link'
import { clsx } from '@otog/ui/utils'

import { environment } from '../env'

export const Footer = (props: { className?: string }) => (
  <footer className={clsx('container pb-4 justify-self-end', props.className)}>
    <hr className="mb-2" />
    <div className="flex flex-row justify-between text-sm flex-wrap">
      {environment.OFFLINE_MODE ? (
        <span>หากมีข้อสงสัย กรุณายกมือถาม</span>
      ) : (
        <span>
          สามารถรายงานปัญหา
          <Link asChild>
            <a href={environment.GITHUB_LINK} target="_blank" rel="noreferrer">
              ได้ที่นี่
            </a>
          </Link>
        </span>
      )}
      <span>
        {environment.OFFLINE_MODE ? (
          '© 2025 Phakphum Dev Team'
        ) : (
          <Link asChild variant="hidden">
            <a href={environment.CONTACT_LINK} target="_blank" rel="noreferrer">
              © 2025 Phakphum Dev Team
            </a>
          </Link>
        )}
      </span>
    </div>
  </footer>
)
