'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaUser } from 'react-icons/fa';


export default function Header() {
  const pathname = usePathname()

  return (
    <header className="flex items-center justify-between px-6 py-4 mx-36 bg-white shadow-md mt-10 rounded-2xl">
      <h1 className="text-xl font-bold text-blue-600"><Link href="/">SmartSender</Link></h1>
      <nav className="space-x-4">
        <div className='flex items-center gap-2'>
        <Link
          href="/login"
          className={`hover:text-blue-500 ${pathname === '/login' ? 'font-semibold text-custom-blue' : ''}`}
        >
        <FaUser className="text-xm" />
        </Link>
        </div>
      </nav>
    </header>
  )
}