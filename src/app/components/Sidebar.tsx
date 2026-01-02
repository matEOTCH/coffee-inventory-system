'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  
  const menuItems = [
    { icon: '🏠', path: '/', label: 'Inicio' },
    { icon: '☕', path: '/inventario', label: 'Operativo' },
    { icon: '🧹', path: '/suministros', label: 'Suministros' },
    { icon: '⚙️', path: '/alertas', label: 'Alertas' },
  ]

  return (
    <aside className="w-24 min-h-screen bg-white border-r border-gray-200 flex flex-col items-center py-10 sticky top-0 z-50">
      <div className="mb-12">
        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-black text-xl">C</div>
      </div>
      
      <nav className="flex flex-col space-y-8">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link key={item.path} href={item.path} title={item.label} className="relative group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                isActive ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-200'
              }`}>
                {item.icon}
              </div>
              {isActive && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-black rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}