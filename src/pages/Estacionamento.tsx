import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout/Layout'
import Card from '../components/UI/Card'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { Car, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface VagaEstacionamento {
  id: string
  acomodacao_id: string
  acomodacao_nome: string
  acomodacao_numero: string
  ocupada: boolean
  cliente_nome?: string
  hospedagem_id?: string
}

const Estacionamento: React.FC = () => {
  const [vagas, setVagas] = useState<VagaEstacionamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVagas()
  }, [])

  const loadVagas = async () => {
    try {
      if (!supabase) {
        // Mock data para demonstração
        setVagas([
          {
            id: '1',
            acomodacao_id: '1',
            acomodacao_nome: 'Suíte Lopes Mendes',
            acomodacao_numero: '101',
            ocupada: false
          },
          {
            id: '2',
            acomodacao_id: '2',
            acomodacao_nome: 'Suíte Parnaioca',
            acomodacao_numero: '102',
            ocupada: true,
            cliente_nome: 'João Silva',
            hospedagem_id: 'hosp1'
          },
          {
            id: '3',
            acomodacao_id: '3',
            acomodacao_nome: 'Suíte Lagoa Azul',
            acomodacao_numero: '103',
            ocupada: false
          }
        ])
        setLoading(false)
        return
      }

      // Buscar acomodações com estacionamento e verificar ocupação
      const { data: acomodacoes } = await supabase
        .from('acomodacoes')
        .select('id, nome, numero')
        .eq('tem_estacionamento', true)
        .eq('ativo', true)

      if (!acomodacoes) {
        setVagas([])
        return
      }

      // Buscar hospedagens ativas para verificar ocupação
      const { data: hospedagens } = await supabase
        .from('hospedagens')
        .select(`
          id,
          acomodacao_id,
          clientes!inner(nome)
        `)
        .eq('status', 'checkin')

      const vagasData: VagaEstacionamento[] = acomodacoes.map(acomodacao => {
        const hospedagem = hospedagens?.find(h => h.acomodacao_id === acomodacao.id)
        
        return {
          id: acomodacao.id,
          acomodacao_id: acomodacao.id,
          acomodacao_nome: acomodacao.nome,
          acomodacao_numero: acomodacao.numero,
          ocupada: !!hospedagem,
          cliente_nome: hospedagem ? (hospedagem as any).clientes.nome : undefined,
          hospedagem_id: hospedagem?.id
        }
      })

      setVagas(vagasData)
    } catch (error) {
      toast.error('Erro ao carregar vagas de estacionamento')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const vagasOcupadas = vagas.filter(v => v.ocupada).length
  const vagasLivres = vagas.length - vagasOcupadas

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Carregando estacionamento..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Estacionamento</h1>
          <p className="text-gray-600 mt-2">Controle das vagas de estacionamento da pousada</p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total de Vagas</p>
                <p className="text-2xl font-bold text-gray-900">{vagas.length}</p>
              </div>
              <Car className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Vagas Livres</p>
                <p className="text-2xl font-bold text-gray-900">{vagasLivres}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Vagas Ocupadas</p>
                <p className="text-2xl font-bold text-gray-900">{vagasOcupadas}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Mapa de Vagas */}
        <Card title="Mapa do Estacionamento" subtitle="Status atual das vagas">
          {vagas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma vaga de estacionamento configurada</p>
              <p className="text-sm mt-2">Configure acomodações com estacionamento para visualizar as vagas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {vagas.map((vaga) => (
                <div
                  key={vaga.id}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    vaga.ocupada
                      ? 'border-red-300 bg-red-50'
                      : 'border-green-300 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Car className={`h-6 w-6 ${
                        vaga.ocupada ? 'text-red-600' : 'text-green-600'
                      }`} />
                      <span className="font-semibold text-gray-900">
                        Vaga {vaga.acomodacao_numero}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vaga.ocupada
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {vaga.ocupada ? 'Ocupada' : 'Livre'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <strong>Acomodação:</strong> {vaga.acomodacao_nome}
                    </p>
                    {vaga.ocupada && vaga.cliente_nome && (
                      <p className="text-sm text-gray-600">
                        <strong>Cliente:</strong> {vaga.cliente_nome}
                      </p>
                    )}
                  </div>

                  {vaga.ocupada ? (
                    <div className="mt-4 flex items-center text-red-600">
                      <XCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Vaga ocupada</span>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Vaga disponível</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Informações Adicionais */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Informações" subtitle="Sobre o estacionamento">
            <div className="space-y-3 text-sm text-gray-600">
              <p>• As vagas de estacionamento são vinculadas às acomodações</p>
              <p>• Cada acomodação pode ter no máximo uma vaga</p>
              <p>• A ocupação é controlada automaticamente pelo sistema de check-in/out</p>
              <p>• Apenas acomodações ativas com estacionamento aparecem aqui</p>
            </div>
          </Card>

          <Card title="Taxa de Ocupação" subtitle="Estatísticas do estacionamento">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taxa de Ocupação</span>
                <span className="font-bold text-lg">
                  {vagas.length > 0 ? Math.round((vagasOcupadas / vagas.length) * 100) : 0}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${vagas.length > 0 ? (vagasOcupadas / vagas.length) * 100 : 0}%`
                  }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{vagasLivres}</p>
                  <p className="text-xs text-gray-500">Livres</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{vagasOcupadas}</p>
                  <p className="text-xs text-gray-500">Ocupadas</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default Estacionamento