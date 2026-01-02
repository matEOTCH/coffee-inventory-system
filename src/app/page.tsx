'use client'

import Link from 'next/link'

export default function DashboardPrincipal() {
  const opciones = [
    { name: 'Inventario Operativo', desc: 'Café e Insumos', icon: '☕', link: '/inventario' },
    { name: 'Insumos No Perecibles', desc: 'Limpieza y Papelería', icon: '🧹', link: '/suministros' },
    { name: 'Configuración Alertas', desc: 'Límites de Telegram', icon: '⚙️', link: '/alertas' },
    { name: 'Simulador de Ventas', desc: 'Prueba de Descuento', icon: '📉', link: '/simulador' }
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900 text-white">
      <header className="text-center mb-16">
        <h1 className="text-5xl font-black tracking-tighter mb-4 italic uppercase">Coffee Hub System</h1>
        <p className="text-gray-400 font-bold tracking-widest uppercase text-xs">Gestión inteligente de inventario</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {opciones.map((op, idx) => (
          <Link key={idx} href={op.link} className="group">
            <div className="bg-gray-800 p-8 rounded-[2.5rem] border border-gray-700 shadow-2xl transform transition-all duration-300 group-hover:-translate-y-4 group-hover:bg-gray-700 flex items-center space-x-6">
              <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
                {op.icon}
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">{op.name}</h3>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wide">{op.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}