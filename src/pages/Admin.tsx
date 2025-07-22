import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout/Layout'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Shield, Users, Database, Activity, Settings, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface AdminStats {
  total_usuarios: number
  total_logs: number
  sistema_status: 'online' | 'manutencao'
  ultima_atualizacao: string
  logs_recentes: Array<{
    id: string
    usuario: string
    acao: string
    tabela: string
    data: string
  }>
}

const Admin: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    total_usuarios: 0,
    total_logs: 0,
    sistema_status: 'online',
    ultima_atualizacao: new Date().toISOString(),
    logs_recentes: []
  })
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
      return
    }
    loadAdminData()
  }, [isAdmin])

  const loadAdminData = async () => {
    try {
      if (!supabase) {
        // Mock data para demonstração
        setStats({
          total_usuarios: 2,
          total_logs: 156,
          sistema_status: 'online',
          ultima_atualizacao: new Date().toISOString(),
          logs_recentes: [
            {
              id: '1',
              usuario: 'admin@parnaioca.com',
              acao: 'CREATE',
              tabela: 'clientes',
              data: new Date().toISOString()
            },
            {
              id: '2',
              usuario: 'funcionario@parnaioca.com',
              acao: 'UPDATE',
              tabela: 'acomodacoes',
              data: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: '3',
              usuario: 'admin@parnaioca.com',
              acao: 'DELETE',
              tabela: 'itens_frigobar',
              data: new Date(Date.now() - 7200000).toISOString()
            }
          ]
        })
        setLoading(false)
        return
      }

      // Carregar logs de alterações
      const { data: logs, count: totalLogs } = await supabase
        .from('logs_alteracoes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10)

      setStats({
        total_usuarios: 2, // Mock - em produção viria do auth
        total_logs: totalLogs || 0,
        sistema_status: 'online',
        ultima_atualizacao: new Date().toISOString(),
        logs_recentes: logs?.map(log => ({
          id: log.id,
          usuario: log.usuario_id,
          acao: log.operacao,
          tabela: log.tabela,
          data: log.created_at
        })) || []
      })
    } catch (error) {
      toast.error('Erro ao carregar dados administrativos')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const limparLogs = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      if (!supabase) {
        toast.success('Logs limpos com sucesso (simulação)')
        setStats(prev => ({ ...prev, total_logs: 0, logs_recentes: [] }))
        return
      }

      const { error } = await supabase
        .from('logs_alteracoes')
        .delete()
        .neq('id', '')

      if (error) throw error

      toast.success('Logs limpos com sucesso')
      loadAdminData()
    } catch (error) {
      toast.error('Erro ao limpar logs')
    }
  }

  const exportarDados = () => {
    toast.info('Funcionalidade de exportação será implementada em breve')
  }

  const fazerBackup = () => {
    toast.info('Funcionalidade de backup será implementada em breve')
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="p-6">
          <Card className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
          </Card>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Carregando painel administrativo..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administração</h1>
          <p className="text-gray-600 mt-2">Painel de controle administrativo do sistema</p>
        </div>

        {/* Status do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Status do Sistema</p>
                <p className="text-lg font-bold text-green-600">Online</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_usuarios}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Logs de Sistema</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_logs}</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Última Atualização</p>
                <p className="text-sm font-bold text-gray-900">
                  {format(new Date(stats.ultima_atualizacao), 'dd/MM HH:mm', { locale: ptBR })}
                </p>
              </div>
              <Settings className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logs Recentes */}
          <Card title="Logs de Alterações Recentes" subtitle="Últimas atividades do sistema">
            {stats.logs_recentes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum log encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.logs_recentes.map((log) => (
                  <div key={log.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.acao} em {log.tabela}
                        </p>
                        <p className="text-xs text-gray-600">Por: {log.usuario}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(log.data), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Ações Administrativas */}
          <Card title="Ações Administrativas" subtitle="Ferramentas de administração">
            <div className="space-y-4">
              <Button
                onClick={fazerBackup}
                className="w-full flex items-center justify-center space-x-2"
                variant="primary"
              >
                <Database className="h-4 w-4" />
                <span>Fazer Backup do Sistema</span>
              </Button>

              <Button
                onClick={exportarDados}
                className="w-full flex items-center justify-center space-x-2"
                variant="secondary"
              >
                <Settings className="h-4 w-4" />
                <span>Exportar Dados</span>
              </Button>

              <Button
                onClick={limparLogs}
                className="w-full flex items-center justify-center space-x-2"
                variant="danger"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Limpar Logs do Sistema</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Informações do Sistema */}
        <div className="mt-6">
          <Card title="Informações do Sistema" subtitle="Detalhes técnicos e configurações">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Configurações Atuais</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versão do Sistema:</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Banco de Dados:</span>
                    <span className="font-medium">PostgreSQL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ambiente:</span>
                    <span className="font-medium">Produção</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Último Backup:</span>
                    <span className="font-medium">Hoje, 02:00</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Estatísticas de Uso</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Logins Hoje:</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operações/Hora:</span>
                    <span className="font-medium">~8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-medium text-green-600">99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Espaço Usado:</span>
                    <span className="font-medium">2.3 GB</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default Admin