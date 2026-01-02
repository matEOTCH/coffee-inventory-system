'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts'

export default function ReporteConsumo() {
  const [reporte, setReporte] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [insumosList, setInsumosList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // --- ESTADOS DE FILTROS ---
  const [periodo, setPeriodo] = useState('mes')
  const [ranking, setRanking] = useState('top') // 'top' = más consumidos, 'bottom' = menos
  const [catFilter, setCatFilter] = useState('all')
  const [insumoFilter, setInsumoFilter] = useState('all')

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

  // 1. CARGA DE METADATOS (Categorías e Insumos para los filtros)
  useEffect(() => {
    const fetchMetadata = async () => {
      const { data: cats } = await supabase.from('categories').select('*')
      const { data: ins } = await supabase.from('raw_materials').select('id, name')
      setCategories(cats || [])
      setInsumosList(ins || [])
    }
    fetchMetadata()
  }, [])

  // 2. LÓGICA DE REPORTE FILTRADO
  useEffect(() => {
    const fetchConsumo = async () => {
      setLoading(true)
      const fechaInicio = new Date()
      if (periodo === 'semana') fechaInicio.setDate(fechaInicio.getDate() - 7)
      else fechaInicio.setMonth(fechaInicio.getMonth() - 1)

      let query = supabase
        .from('stock_movements')
        .select(`
          quantity_changed,
          raw_materials!inner ( id, name, usage_unit, category_id )
        `)
        .lt('quantity_changed', 0)
        .gte('created_at', fechaInicio.toISOString())

      // Aplicar filtros de base de datos si no es "all"
      if (catFilter !== 'all') query = query.eq('raw_materials.category_id', catFilter)
      if (insumoFilter !== 'all') query = query.eq('raw_materials.id', insumoFilter)

      const { data } = await query

      if (data) {
        const agrupado = data.reduce((acc: any, curr: any) => {
          const nombre = curr.raw_materials.name
          if (!acc[nombre]) {
            acc[nombre] = { name: nombre, total: 0, unidad: curr.raw_materials.usage_unit }
          }
          acc[nombre].total += Math.abs(curr.quantity_changed)
          return acc
        }, {})

        // Lógica de Ranking (Top 5 / Bottom 5)
        let dataFinal = Object.values(agrupado)
        if (ranking === 'top') {
          dataFinal.sort((a: any, b: any) => b.total - a.total)
        } else {
          dataFinal.sort((a: any, b: any) => a.total - b.total)
        }

        setReporte(dataFinal.slice(0, 5)) // Siempre mostramos el Top 5 del criterio seleccionado
      }
      setLoading(false)
    }
    fetchConsumo()
  }, [periodo, ranking, catFilter, insumoFilter])

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8 tracking-tighter">Inteligencia de Consumo</h1>

        {/* BARRA DE FILTROS SUPERIOR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Periodo</label>
            <select className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-sm" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              <option value="semana">Últimos 7 días</option>
              <option value="mes">Últimos 30 días</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Ver Ranking</label>
            <select className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-sm" value={ranking} onChange={(e) => setRanking(e.target.value)}>
              <option value="top">Más Consumidos (Top 5)</option>
              <option value="bottom">Menos Consumidos (Top 5)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Categoría</label>
            <select className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-sm" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="all">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Insumo Específico</label>
            <select className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-sm" value={insumoFilter} onChange={(e) => setInsumoFilter(e.target.value)}>
              <option value="all">Todos los insumos</option>
              {insumosList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

        </div>

        {loading ? (
          <div className="h-[400px] flex items-center justify-center font-black text-gray-300 animate-pulse text-2xl uppercase italic">Filtrando datos...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* GRÁFICO (Ocupa 2 columnas) */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 h-[500px]">
              <p className="font-black text-blue-600 uppercase text-[10px] mb-6 tracking-widest">Visualización {ranking === 'top' ? 'Máximo' : 'Mínimo'} Gasto</p>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={reporte} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#1f2937', fontWeight: 'bold', fontSize: 12}} width={120} />
                  <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="total" radius={[0, 10, 10, 0]} barSize={40}>
                    {reporte.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* LISTA LATERAL (Ocupa 1 columna) */}
            <div className="space-y-4">
              <p className="font-black text-gray-400 uppercase text-[10px] mb-2 tracking-widest ml-2">Detalle del Top 5</p>
              {reporte.map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-blue-500 transition">
                  <div className="flex-1">
                    <p className="text-xl font-black text-gray-800">{item.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{item.unidad}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${ranking === 'top' ? 'text-red-500' : 'text-green-500'}`}>
                      {new Intl.NumberFormat('es-PE').format(item.total)}
                    </p>
                  </div>
                </div>
              ))}
              {reporte.length === 0 && <p className="text-center text-gray-400 font-bold p-10">Sin datos para este filtro.</p>}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}