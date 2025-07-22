import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout/Layout'
import Card from '../components/UI/Card'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Award, Star, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

interface AnalyticsData {
  item_mais_vendido: {
    nome: string
    quantidade: number
  }
  quarto_mais_rentavel: {
    nome: string
    receita: number
  }
  ocupacao_mensal: Array<{
    mes: string
    ocupacao: number
  }>
  receita_por_tipo: Array<{
    tipo: string
    receita: number
  }>
  clientes_por_estado: Array<{
    estado: string
    quantidade: number
  }>
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    item_mais_vendido: { nome: '', quantidade: 0 },
    quarto_mais_rentavel: { nome: '', receita: 0 },
    ocupacao_mensal: [],
    receita_por_tipo: [],
    clientes_por_estado: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      if (!supabase) {
        // Mock data para demonstração
        setData({
          item_mais_vendido: {
            nome: 'Cerveja Heineken 330ml',
            quantidade: 45
          },
          quarto_mais_rentavel: {
            nome: 'Suíte Parnaioca',
            receita: 8400.00
          },
          ocupacao_mensal: [
            { mes: 'Jan', ocupacao: 65 },
            { mes: 'Fev', ocupacao: 78 },
            { mes: 'Mar', ocupacao: 82 },
            { mes: 'Abr', ocupacao: 75 },
            { mes: 'Mai', ocupacao: 88 },
            { mes: 'Jun', ocupacao: 92 }
          ],
          receita_por_tipo: [
            { tipo: 'Suítes', receita: 25600 },
            { tipo: 'Apartamentos', receita: 18400 }
          ],
          clientes_por_estado: [
            { estado: 'RJ', quantidade: 25 },
            { estado: 'SP', quantidade: 18 },
            { estado: 'MG', quantidade: 12 },
            { estado: 'ES', quantidade: 8 },
            { estado: 'Outros', quantidade: 7 }
          ]
        })
        setLoading(false)
        return
      }

      // Item mais vendido do frigobar
      const { data: consumoFrigobar } = await supabase
        .from('consumo_frigobar')
        .select(`
          quantidade,
          itens_frigobar!inner(nome)
        `)

      // Processar dados do frigobar
      const itensPorQuantidade: { [key: string]: number } = {}
      consumoFrigobar?.forEach(item => {
        const nome = (item as any).itens_frigobar.nome
        itensPorQuantidade[nome] = (itensPorQuantidade[nome] || 0) + item.quantidade
      })

      const itemMaisVendido = Object.entries(itensPorQuantidade)
        .sort(([,a], [,b]) => b - a)[0] || ['', 0]

      // Quarto mais rentável
      const { data: hospedagens } = await supabase
        .from('hospedagens')
        .select(`
          valor_diaria,
          acomodacoes!inner(nome)
        `)

      // Processar receita por acomodação
      const receitaPorAcomodacao: { [key: string]: number } = {}
      hospedagens?.forEach(hospedagem => {
        const nome = (hospedagem as any).acomodacoes.nome
        receitaPorAcomodacao[nome] = (receitaPorAcomodacao[nome] || 0) + hospedagem.valor_diaria
      })

      const quartoMaisRentavel = Object.entries(receitaPorAcomodacao)
        .sort(([,a], [,b]) => b - a)[0] || ['', 0]

      // Clientes por estado
      const { data: clientes } = await supabase
        .from('clientes')
        .select('estado')

      const clientesPorEstado: { [key: string]: number } = {}
      clientes?.forEach(cliente => {
        clientesPorEstado[cliente.estado] = (clientesPorEstado[cliente.estado] || 0) + 1
      })

      const clientesEstadoArray = Object.entries(clientesPorEstado)
        .map(([estado, quantidade]) => ({ estado, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)

      setData({
        item_mais_vendido: {
          nome: itemMaisVendido[0],
          quantidade: itemMaisVendido[1]
        },
        quarto_mais_rentavel: {
          nome: quartoMaisRentavel[0],
          receita: quartoMaisRentavel[1]
        },
        ocupacao_mensal: [
          { mes: 'Jan', ocupacao: 65 },
          { mes: 'Fev', ocupacao: 78 },
          { mes: 'Mar', ocupacao: 82 },
          { mes: 'Abr', ocupacao: 75 },
          { mes: 'Mai', ocupacao: 88 },
          { mes: 'Jun', ocupacao: 92 }
        ],
        receita_por_tipo: [
          { tipo: 'Suítes', receita: 25600 },
          { tipo: 'Apartamentos', receita: 18400 }
        ],
        clientes_por_estado: clientesEstadoArray
      })
    } catch (error) {
      toast.error('Erro ao carregar dados de analytics')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Carregando analytics..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Análises avançadas e insights da pousada</p>
        </div>

        {/* Destaques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Item Mais Vendido</p>
                <p className="text-xl font-bold text-gray-900">{data.item_mais_vendido.nome}</p>
                <p className="text-sm text-yellow-600">{data.item_mais_vendido.quantidade} unidades vendidas</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Quarto Mais Rentável</p>
                <p className="text-xl font-bold text-gray-900">{data.quarto_mais_rentavel.nome}</p>
                <p className="text-sm text-green-600">
                  R$ {data.quarto_mais_rentavel.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em receita
                </p>
              </div>
              <Star className="h-8 w-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Ocupação Mensal */}
          <Card title="Taxa de Ocupação Mensal" subtitle="Evolução da ocupação ao longo do ano">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.ocupacao_mensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Ocupação']} />
                  <Line 
                    type="monotone" 
                    dataKey="ocupacao" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Receita por Tipo */}
          <Card title="Receita por Tipo de Acomodação" subtitle="Distribuição da receita">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.receita_por_tipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tipo, receita }) => `${tipo}: R$ ${receita.toLocaleString('pt-BR')}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="receita"
                  >
                    {data.receita_por_tipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Clientes por Estado */}
        <Card title="Distribuição de Clientes por Estado" subtitle="Origem geográfica dos clientes">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.clientes_por_estado}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="estado" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}`, 'Clientes']} />
                <Bar dataKey="quantidade" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Insights */}
        <div className="mt-6">
          <Card title="Insights e Recomendações" subtitle="Análises baseadas nos dados">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-blue-900">Tendência de Crescimento</h4>
                </div>
                <p className="text-sm text-blue-700">
                  A taxa de ocupação tem mostrado crescimento consistente, com pico em junho (92%).
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <Award className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-semibold text-green-900">Produto Destaque</h4>
                </div>
                <p className="text-sm text-green-700">
                  {data.item_mais_vendido.nome} é o item mais popular do frigobar. Considere aumentar o estoque.
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <Star className="h-5 w-5 text-purple-600 mr-2" />
                  <h4 className="font-semibold text-purple-900">Acomodação Premium</h4>
                </div>
                <p className="text-sm text-purple-700">
                  {data.quarto_mais_rentavel.nome} gera a maior receita. Foque em manter sua qualidade.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default Analytics