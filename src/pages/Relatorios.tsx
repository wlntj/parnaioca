import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout/Layout'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Input from '../components/Forms/Input'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { FileText, Download, Calendar, Users, DollarSign, TrendingUp } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface RelatorioData {
  clientes_periodo: number
  clientes_ativos: number
  clientes_inativos: number
  receita_periodo: number
  hospedagens_periodo: number
  taxa_ocupacao: number
}

const Relatorios: React.FC = () => {
  const [data, setData] = useState<RelatorioData>({
    clientes_periodo: 0,
    clientes_ativos: 0,
    clientes_inativos: 0,
    receita_periodo: 0,
    hospedagens_periodo: 0,
    taxa_ocupacao: 0
  })
  const [loading, setLoading] = useState(true)
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [tipoRelatorio, setTipoRelatorio] = useState('geral')

  useEffect(() => {
    loadRelatorioData()
  }, [dataInicio, dataFim])

  const loadRelatorioData = async () => {
    try {
      if (!supabase) {
        // Mock data para demonstração
        setData({
          clientes_periodo: 15,
          clientes_ativos: 45,
          clientes_inativos: 5,
          receita_periodo: 12500.00,
          hospedagens_periodo: 8,
          taxa_ocupacao: 75
        })
        setLoading(false)
        return
      }

      // Clientes cadastrados no período
      const { count: clientesPeriodo } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dataInicio)
        .lte('created_at', dataFim + 'T23:59:59')

      // Clientes ativos e inativos
      const { count: clientesAtivos } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)

      const { count: clientesInativos } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', false)

      // Hospedagens e receita do período
      const { data: hospedagens } = await supabase
        .from('hospedagens')
        .select('valor_diaria')
        .gte('created_at', dataInicio)
        .lte('created_at', dataFim + 'T23:59:59')

      const receitaPeriodo = hospedagens?.reduce((acc, h) => acc + h.valor_diaria, 0) || 0
      const hospedagensPeriodo = hospedagens?.length || 0

      // Taxa de ocupação (simplificada)
      const { count: totalAcomodacoes } = await supabase
        .from('acomodacoes')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)

      const { count: acomodacoesOcupadas } = await supabase
        .from('hospedagens')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'checkin')

      const taxaOcupacao = totalAcomodacoes && acomodacoesOcupadas 
        ? Math.round((acomodacoesOcupadas / totalAcomodacoes) * 100)
        : 0

      setData({
        clientes_periodo: clientesPeriodo || 0,
        clientes_ativos: clientesAtivos || 0,
        clientes_inativos: clientesInativos || 0,
        receita_periodo: receitaPeriodo,
        hospedagens_periodo: hospedagensPeriodo,
        taxa_ocupacao: taxaOcupacao
      })
    } catch (error) {
      toast.error('Erro ao carregar dados do relatório')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const gerarRelatorio = () => {
    toast.info('Funcionalidade de geração de PDF será implementada em breve')
  }

  const exportarDados = () => {
    toast.info('Funcionalidade de exportação será implementada em breve')
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Carregando relatórios..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-2">Análises e relatórios da pousada</p>
        </div>

        {/* Filtros */}
        <Card className="mb-6" title="Filtros" subtitle="Configure o período e tipo de relatório">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Data Início"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />

            <Input
              label="Data Fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Relatório
              </label>
              <select
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="geral">Relatório Geral</option>
                <option value="clientes">Clientes</option>
                <option value="financeiro">Financeiro</option>
                <option value="ocupacao">Ocupação</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadRelatorioData}
                className="w-full"
              >
                Atualizar
              </Button>
            </div>
          </div>
        </Card>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Novos Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{data.clientes_periodo}</p>
                <p className="text-xs text-gray-400">No período selecionado</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Receita do Período</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {data.receita_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400">{data.hospedagens_periodo} hospedagens</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Taxa de Ocupação</p>
                <p className="text-2xl font-bold text-gray-900">{data.taxa_ocupacao}%</p>
                <p className="text-xs text-gray-400">Atual</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Clientes Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{data.clientes_ativos}</p>
                <p className="text-xs text-gray-400">{data.clientes_inativos} inativos</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Relatórios Disponíveis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Relatórios de Clientes" subtitle="Análises sobre a base de clientes">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Clientes por Período</h4>
                  <p className="text-sm text-gray-600">Lista de clientes cadastrados no período</p>
                </div>
                <Button size="sm" onClick={gerarRelatorio}>
                  <FileText className="h-4 w-4 mr-1" />
                  Gerar
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Clientes Ativos vs Inativos</h4>
                  <p className="text-sm text-gray-600">Comparativo do status dos clientes</p>
                </div>
                <Button size="sm" onClick={gerarRelatorio}>
                  <FileText className="h-4 w-4 mr-1" />
                  Gerar
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Clientes por Localização</h4>
                  <p className="text-sm text-gray-600">Distribuição geográfica dos clientes</p>
                </div>
                <Button size="sm" onClick={gerarRelatorio}>
                  <FileText className="h-4 w-4 mr-1" />
                  Gerar
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Relatórios Financeiros" subtitle="Análises de receita e ocupação">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Receita por Período</h4>
                  <p className="text-sm text-gray-600">Faturamento detalhado do período</p>
                </div>
                <Button size="sm" onClick={gerarRelatorio}>
                  <FileText className="h-4 w-4 mr-1" />
                  Gerar
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Ocupação por Acomodação</h4>
                  <p className="text-sm text-gray-600">Taxa de ocupação por quarto</p>
                </div>
                <Button size="sm" onClick={gerarRelatorio}>
                  <FileText className="h-4 w-4 mr-1" />
                  Gerar
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Consumo de Frigobar</h4>
                  <p className="text-sm text-gray-600">Itens mais consumidos e receita</p>
                </div>
                <Button size="sm" onClick={gerarRelatorio}>
                  <FileText className="h-4 w-4 mr-1" />
                  Gerar
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Ações */}
        <div className="mt-6">
          <Card title="Ações" subtitle="Exportar e compartilhar dados">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={gerarRelatorio}
                className="flex items-center justify-center space-x-2"
                variant="primary"
              >
                <FileText className="h-5 w-5" />
                <span>Gerar Relatório PDF</span>
              </Button>

              <Button
                onClick={exportarDados}
                className="flex items-center justify-center space-x-2"
                variant="secondary"
              >
                <Download className="h-5 w-5" />
                <span>Exportar Excel</span>
              </Button>

              <Button
                onClick={() => {
                  setDataInicio(format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'))
                  setDataFim(format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'))
                }}
                className="flex items-center justify-center space-x-2"
                variant="secondary"
              >
                <Calendar className="h-5 w-5" />
                <span>Mês Anterior</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default Relatorios