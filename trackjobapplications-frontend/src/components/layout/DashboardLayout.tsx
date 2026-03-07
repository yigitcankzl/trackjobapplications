import { ReactNode } from 'react'
import Sidebar from '../dashboard/Sidebar'

interface Props {
  children: ReactNode
}

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-8 pt-8 pb-6">
          {children}
        </div>
      </div>
    </div>
  )
}
