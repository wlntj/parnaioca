import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout/Layout'
import Card from '../components/UI/Card'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { Users, Bed, DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DashboardStats {
  totalClientes: number
  totalAcomodacoes: number
  ocupacaoAtual: number
  receitaMensal: number
  hospedagensAtivas: Array<{
    id: string
    cliente_nome: string
    acomodacao_nome: string
    acomodacao_numero: string
    data_checkin: string
    data_checkout: string | null
  }>
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    totalAcomodacoes: 0,
    ocupacaoAtual: 0,
    receitaMensal: 0,
    hospedagensAtivas: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      if (!supabase) {
        // Mock data para demonstração
        setStats({
          totalClientes: 25,
          totalAcomodacoes: 8,
          ocupacaoAtual: 3,
          receitaMensal: 15600.00,
          hospedagensAtivas: [
            {
              id: '1',
              cliente_nome: 'João Silva',
              acomodacao_nome: 'Suíte Parnaioca',
              acomodacao_numero: '102',
              data_checkin: new Date().toISOString(),
              data_checkout: null
            },
            {
              id: '2',
              cliente_nome: 'Maria Santos',
              acomodacao_nome: 'Suíte Lopes Mendes',
              acomodacao_numero: '101',
              data_checkin: new Date(Date.now() - 86400000).toISOString(),
              data_checkout: null
            }
          ]
        })
        setLoading(false)
        return
      }

      // Total de clientes ativos
      const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)

      // Total de acomodações ativas
      const { count: totalAcomodacoes } = await supabase
        .from('acomodacoes')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)

      // Hospedagens ativas (ocupação atual)
      const { data: hospedagensAtivas } = await supabase
        .from('hospedagens')
        .select(`
          id,
          data_checkin,
          data_checkout,
          clientes!inner(nome),
          acomodacoes!inner(nome, numero)
        `)
        .eq('status', 'checkin')

      // Receita do mês atual
      const inicioMes = new Date()
      inicioMes.setDate(1)
      const { data: hospedagensMes } = await supabase
        .from('hospedagens')
        .select('valor_diaria')
        .gte('created_at', inicioMes.toISOString())

      const receitaMensal = hospedagensMes?.reduce((acc, h) => acc + h.valor_diaria, 0) || 0

      setStats({
        totalClientes: totalClientes || 0,
        totalAcomodacoes: totalAcomodacoes || 0,
        ocupacaoAtual: hospedagensAtivas?.length || 0,
        receitaMensal,
        hospedagensAtivas: hospedagensAtivas?.map(h => ({
          id: h.id,
          cliente_nome: (h as any).clientes.nome,
          acomodacao_nome: (h as any).acomodacoes.nome,
          acomodacao_numero: (h as any).acomodacoes.numero,
          data_checkin: h.data_checkin,
          data_checkout: h.data_checkout
        })) || []
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Carregando dashboard..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Visão geral da Pousada Parnaioca</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClientes}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Acomodações</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAcomodacoes}</p>
              </div>
              <Bed className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Ocupação Atual</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ocupacaoAtual}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Receita Mensal</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {stats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Hospedagens Ativas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Hóspedes Atuais" subtitle="Clientes com check-in realizado">
            {stats.hospedagensAtivas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum hóspede no momento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.hospedagensAtivas.map((hospedagem) => (
                  <div key={hospedagem.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{hospedagem.cliente_nome}</h4>
                        <p className="text-sm text-gray-600">
                          {hospedagem.acomodacao_nome} - Nº {hospedagem.acomodacao_numero}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Check-in: {format(new Date(hospedagem.data_checkin), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Ativo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Resumo do Dia" subtitle="Informações importantes">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-800 font-medium">Taxa de Ocupação</span>
                <span className="text-blue-600 font-bold">
                  {stats.totalAcomodacoes > 0 
                    ? Math.round((stats.ocupacaoAtual / stats.totalAcomodacoes) * 100) 
                    : 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-800 font-medium">Quartos Disponíveis</span>
                <span className="text-green-600 font-bold">
                  {stats.totalAcomodacoes - stats.ocupacaoAtual}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-800 font-medium">Data Atual</span>
                <span className="text-purple-600 font-bold">
                  {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard