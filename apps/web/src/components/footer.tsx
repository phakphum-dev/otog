import { Link } from '@otog/ui'

import { environment } from '../env'

export const Footer = () => (
  <footer className="container mt-8 pb-4 justify-self-end">
    <hr className="mb-2" />
    <div className="flex flex-col sm:flex-row justify-between">
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
          '© 2021 Phakphum Dev Team'
        ) : (
          <Link asChild variant="hidden">
            <a href={environment.CONTACT_LINK} target="_blank" rel="noreferrer">
              © 2021 Phakphum Dev Team
            </a>
          </Link>
        )}
      </span>
    </div>
  </footer>
)
