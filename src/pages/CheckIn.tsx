import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout/Layout'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, User, Bed, LogIn, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface CheckInData {
  hospedagens_ativas: Array<{
    id: string
    cliente_nome: string
    acomodacao_nome: string
    acomodacao_numero: string
    data_checkin: string
    data_checkout: string | null
    valor_diaria: number
  }>
  acomodacoes_disponiveis: Array<{
    id: string
    nome: string
    numero: string
    valor_diaria: number
  }>
  clientes: Array<{
    id: string
    nome: string
    cpf: string
    email: string
  }>
}

const CheckIn: React.FC = () => {
  const [data, setData] = useState<CheckInData>({
    hospedagens_ativas: [],
    acomodacoes_disponiveis: [],
    clientes: []
  })
  const [loading, setLoading] = useState(true)
  const [showCheckInForm, setShowCheckInForm] = useState(false)
  const [showCheckOutForm, setShowCheckOutForm] = useState(false)
  const [selectedHospedagem, setSelectedHospedagem] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      if (!supabase) {
        // Mock data para demonstração
        setData({
          hospedagens_ativas: [
            {
              id: '1',
              cliente_nome: 'João Silva',
              acomodacao_nome: 'Suíte Parnaioca',
              acomodacao_numero: '102',
              data_checkin: new Date().toISOString(),
              data_checkout: null,
              valor_diaria: 400.00
            }
          ],
          acomodacoes_disponiveis: [
            {
              id: '1',
              nome: 'Suíte Lopes Mendes',
              numero: '101',
              valor_diaria: 350.00
            },
            {
              id: '3',
              nome: 'Suíte Lagoa Azul',
              numero: '103',
              valor_diaria: 380.00
            }
          ],
          clientes: [
            {
              id: '1',
              nome: 'João Silva',
              cpf: '123.456.789-00',
              email: 'joao@email.com'
            },
            {
              id: '2',
              nome: 'Maria Santos',
              cpf: '987.654.321-00',
              email: 'maria@email.com'
            }
          ]
        })
        setLoading(false)
        return
      }

      // Carregar hospedagens ativas
      const { data: hospedagensAtivas } = await supabase
        .from('hospedagens')
        .select(`
          id,
          data_checkin,
          data_checkout,
          valor_diaria,
          clientes!inner(nome),
          acomodacoes!inner(nome, numero)
        `)
        .eq('status', 'checkin')

      // Carregar acomodações disponíveis
      const { data: todasAcomodacoes } = await supabase
        .from('acomodacoes')
        .select('id, nome, numero, valor_diaria')
        .eq('ativo', true)

      // Filtrar acomodações que não estão ocupadas
      const acomodacoesOcupadas = hospedagensAtivas?.map(h => (h as any).acomodacoes.id) || []
      const acomodacoesDisponiveis = todasAcomodacoes?.filter(a => 
        !acomodacoesOcupadas.includes(a.id)
      ) || []

      // Carregar clientes ativos
      const { data: clientes } = await supabase
        .from('clientes')
        .select('id, nome, cpf, email')
        .eq('ativo', true)
        .order('nome')

      setData({
        hospedagens_ativas: hospedagensAtivas?.map(h => ({
          id: h.id,
          cliente_nome: (h as any).clientes.nome,
          acomodacao_nome: (h as any).acomodacoes.nome,
          acomodacao_numero: (h as any).acomodacoes.numero,
          data_checkin: h.data_checkin,
          data_checkout: h.data_checkout,
          valor_diaria: h.valor_diaria
        })) || [],
        acomodacoes_disponiveis: acomodacoesDisponiveis,
        clientes: clientes || []
      })
    } catch (error) {
      toast.error('Erro ao carregar dados')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async (hospedagem: any) => {
    try {
      if (!supabase) {
        // Mock para demonstração
        setData(prev => ({
          ...prev,
          hospedagens_ativas: prev.hospedagens_ativas.filter(h => h.id !== hospedagem.id)
        }))
        toast.success('Check-out realizado com sucesso')
        return
      }

      const { error } = await supabase
        .from('hospedagens')
        .update({
          status: 'checkout',
          data_checkout: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', hospedagem.id)

      if (error) throw error

      toast.success('Check-out realizado com sucesso')
      loadData()
    } catch (error) {
      toast.error('Erro ao realizar check-out')
    }
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Carregando dados de check-in/out..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Check-in / Check-out</h1>
          <p className="text-gray-600 mt-2">Gerencie as entradas e saídas dos hóspedes</p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Hóspedes Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{data.hospedagens_ativas.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Quartos Disponíveis</p>
                <p className="text-2xl font-bold text-gray-900">{data.acomodacoes_disponiveis.length}</p>
              </div>
              <Bed className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Data Atual</p>
                <p className="text-lg font-bold text-gray-900">
                  {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hóspedes Ativos */}
          <Card title="Hóspedes Ativos" subtitle="Clientes com check-in realizado">
            {data.hospedagens_ativas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum hóspede no momento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.hospedagens_ativas.map((hospedagem) => (
                  <div key={hospedagem.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{hospedagem.cliente_nome}</h4>
                        <p className="text-sm text-gray-600">
                          {hospedagem.acomodacao_nome} - Nº {hospedagem.acomodacao_numero}
                        </p>
                        <p className="text-sm text-gray-500">
                          Check-in: {format(new Date(hospedagem.data_checkin), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                        <p className="text-sm font-medium text-blue-600">
                          R$ {hospedagem.valor_diaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleCheckOut(hospedagem)}
                        className="flex items-center space-x-1"
                      >
                        <LogOut className="h-3 w-3" />
                        <span>Check-out</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Acomodações Disponíveis */}
          <Card title="Acomodações Disponíveis" subtitle="Quartos livres para check-in">
            {data.acomodacoes_disponiveis.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bed className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Todas as acomodações estão ocupadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.acomodacoes_disponiveis.map((acomodacao) => (
                  <div key={acomodacao.id} className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{acomodacao.nome}</h4>
                        <p className="text-sm text-gray-600">Nº {acomodacao.numero}</p>
                        <p className="text-sm font-medium text-green-600">
                          R$ {acomodacao.valor_diaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                          // Implementar modal de check-in
                          toast.info('Funcionalidade de check-in será implementada em breve')
                        }}
                        className="flex items-center space-x-1"
                      >
                        <LogIn className="h-3 w-3" />
                        <span>Check-in</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="mt-6">
          <Card title="Ações Rápidas" subtitle="Operações frequentes">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => toast.info('Modal de check-in será implementado')}
                className="flex items-center justify-center space-x-2 h-12"
                variant="primary"
              >
                <LogIn className="h-5 w-5" />
                <span>Realizar Check-in</span>
              </Button>

              <Button
                onClick={() => loadData()}
                className="flex items-center justify-center space-x-2 h-12"
                variant="secondary"
              >
                <Clock className="h-5 w-5" />
                <span>Atualizar Status</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default CheckIn