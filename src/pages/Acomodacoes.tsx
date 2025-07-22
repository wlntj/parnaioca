import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Layout from '../components/Layout/Layout'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Input from '../components/Forms/Input'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { supabase, Database } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Search, Plus, Edit, ToggleLeft, ToggleRight, Bed, Car, Refrigerator } from 'lucide-react'
import toast from 'react-hot-toast'

type Acomodacao = Database['public']['Tables']['acomodacoes']['Row']
type AcomodacaoInsert = Database['public']['Tables']['acomodacoes']['Insert']

const schema = yup.object({
  nome: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  numero: yup.string().required('Número é obrigatório'),
  valor_diaria: yup.number().required('Valor da diária é obrigatório').min(0, 'Valor deve ser positivo'),
  capacidade_maxima: yup.number().required('Capacidade máxima é obrigatória').min(1, 'Capacidade deve ser pelo menos 1'),
  tipo_id: yup.string().required('Tipo de acomodação é obrigatório'),
  tem_frigobar: yup.boolean(),
  tem_estacionamento: yup.boolean(),
})

const Acomodacoes: React.FC = () => {
  const [acomodacoes, setAcomodacoes] = useState<Acomodacao[]>([])
  const [tipos, setTipos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingAcomodacao, setEditingAcomodacao] = useState<Acomodacao | null>(null)
  const { isAdmin } = useAuth()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue
  } = useForm<AcomodacaoInsert>({
    resolver: yupResolver(schema)
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      if (!supabase) {
        // Mock data para demonstração
        setTipos([
          { id: '1', nome: 'Suíte' },
          { id: '2', nome: 'Apartamento' }
        ])
        
        setAcomodacoes([
          {
            id: '1',
            nome: 'Suíte Lopes Mendes',
            numero: '101',
            valor_diaria: 350.00,
            capacidade_maxima: 2,
            tipo_id: '1',
            tem_frigobar: true,
            tem_estacionamento: true,
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            nome: 'Suíte Parnaioca',
            numero: '102',
            valor_diaria: 400.00,
            capacidade_maxima: 3,
            tipo_id: '1',
            tem_frigobar: true,
            tem_estacionamento: true,
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            nome: 'Suíte Lagoa Azul',
            numero: '103',
            valor_diaria: 380.00,
            capacidade_maxima: 2,
            tipo_id: '1',
            tem_frigobar: true,
            tem_estacionamento: false,
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        setLoading(false)
        return
      }

      // Carregar tipos de acomodação
      const { data: tiposData } = await supabase
        .from('tipos_acomodacao')
        .select('id, nome')
        .eq('ativo', true)

      setTipos(tiposData || [])

      // Carregar acomodações
      const { data: acomodacoesData, error } = await supabase
        .from('acomodacoes')
        .select('*')
        .order('numero')

      if (error) throw error
      setAcomodacoes(acomodacoesData || [])
    } catch (error) {
      toast.error('Erro ao carregar dados')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: AcomodacaoInsert) => {
    setSubmitting(true)
    try {
      if (!supabase) {
        // Mock para demonstração
        const newAcomodacao = {
          id: Date.now().toString(),
          ...data,
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        if (editingAcomodacao) {
          setAcomodacoes(prev => prev.map(a => 
            a.id === editingAcomodacao.id ? { ...newAcomodacao, id: editingAcomodacao.id } : a
          ))
          toast.success('Acomodação atualizada com sucesso')
        } else {
          setAcomodacoes(prev => [...prev, newAcomodacao])
          toast.success('Acomodação cadastrada com sucesso')
        }
        
        reset()
        setShowForm(false)
        setEditingAcomodacao(null)
        return
      }

      // Verificar se número já existe
      const { data: existingAcomodacao } = await supabase
        .from('acomodacoes')
        .select('id')
        .eq('numero', data.numero)
        .single()

      if (existingAcomodacao && (!editingAcomodacao || existingAcomodacao.id !== editingAcomodacao.id)) {
        toast.error('Número de acomodação já existe')
        return
      }

      if (editingAcomodacao) {
        const { error } = await supabase
          .from('acomodacoes')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editingAcomodacao.id)

        if (error) throw error
        toast.success('Acomodação atualizada com sucesso')
      } else {
        const { error } = await supabase
          .from('acomodacoes')
          .insert([{ ...data, ativo: true }])

        if (error) throw error
        toast.success('Acomodação cadastrada com sucesso')
      }

      reset()
      setShowForm(false)
      setEditingAcomodacao(null)
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar acomodação')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (acomodacao: Acomodacao) => {
    setEditingAcomodacao(acomodacao)
    setValue('nome', acomodacao.nome)
    setValue('numero', acomodacao.numero)
    setValue('valor_diaria', acomodacao.valor_diaria)
    setValue('capacidade_maxima', acomodacao.capacidade_maxima)
    setValue('tipo_id', acomodacao.tipo_id)
    setValue('tem_frigobar', acomodacao.tem_frigobar)
    setValue('tem_estacionamento', acomodacao.tem_estacionamento)
    setShowForm(true)
  }

  const handleToggleStatus = async (acomodacao: Acomodacao) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem alterar o status')
      return
    }

    try {
      if (!supabase) {
        setAcomodacoes(prev => prev.map(a => 
          a.id === acomodacao.id ? { ...a, ativo: !a.ativo } : a
        ))
        toast.success(`Acomodação ${!acomodacao.ativo ? 'ativada' : 'inativada'} com sucesso`)
        return
      }

      const { error } = await supabase
        .from('acomodacoes')
        .update({ ativo: !acomodacao.ativo, updated_at: new Date().toISOString() })
        .eq('id', acomodacao.id)

      if (error) throw error
      
      toast.success(`Acomodação ${!acomodacao.ativo ? 'ativada' : 'inativada'} com sucesso`)
      loadData()
    } catch (error) {
      toast.error('Erro ao alterar status')
    }
  }

  const getTipoNome = (tipoId: string) => {
    const tipo = tipos.find(t => t.id === tipoId)
    return tipo ? tipo.nome : 'N/A'
  }

  const filteredAcomodacoes = acomodacoes.filter(acomodacao =>
    acomodacao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acomodacao.numero.includes(searchTerm)
  )

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Carregando acomodações..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Acomodações</h1>
            <p className="text-gray-600 mt-2">Gerencie as acomodações da pousada</p>
          </div>
          <Button
            onClick={() => {
              reset()
              setEditingAcomodacao(null)
              setShowForm(true)
            }}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Acomodação</span>
          </Button>
        </div>

        {/* Formulário */}
        {showForm && (
          <Card className="mb-6" title={editingAcomodacao ? 'Editar Acomodação' : 'Nova Acomodação'}>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome da Acomodação"
                {...register('nome')}
                error={errors.nome?.message}
                placeholder="Ex: Suíte Lopes Mendes"
              />

              <Input
                label="Número"
                {...register('numero')}
                error={errors.numero?.message}
                placeholder="Ex: 101"
              />

              <Input
                label="Valor da Diária (R$)"
                type="number"
                step="0.01"
                {...register('valor_diaria')}
                error={errors.valor_diaria?.message}
                placeholder="350.00"
              />

              <Input
                label="Capacidade Máxima"
                type="number"
                {...register('capacidade_maxima')}
                error={errors.capacidade_maxima?.message}
                placeholder="2"
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Acomodação <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('tipo_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um tipo</option>
                  {tipos.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                  ))}
                </select>
                {errors.tipo_id && <p className="mt-1 text-sm text-red-600">{errors.tipo_id.message}</p>}
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('tem_frigobar')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Possui Frigobar</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('tem_estacionamento')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Possui Vaga de Estacionamento</label>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false)
                    setEditingAcomodacao(null)
                    reset()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingAcomodacao ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Busca */}
        <Card className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nome ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </Card>

        {/* Lista */}
        <Card title="Acomodações" subtitle={`${filteredAcomodacoes.length} acomodação(ões) encontrada(s)`}>
          {filteredAcomodacoes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bed className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma acomodação encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAcomodacoes.map((acomodacao) => (
                <div key={acomodacao.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{acomodacao.nome}</h3>
                      <p className="text-sm text-gray-600">Nº {acomodacao.numero}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      acomodacao.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {acomodacao.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Tipo:</strong> {getTipoNome(acomodacao.tipo_id)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Capacidade:</strong> {acomodacao.capacidade_maxima} pessoa(s)
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      R$ {acomodacao.valor_diaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 mb-4">
                    {acomodacao.tem_frigobar && (
                      <div className="flex items-center text-green-600">
                        <Refrigerator className="h-4 w-4 mr-1" />
                        <span className="text-xs">Frigobar</span>
                      </div>
                    )}
                    {acomodacao.tem_estacionamento && (
                      <div className="flex items-center text-blue-600">
                        <Car className="h-4 w-4 mr-1" />
                        <span className="text-xs">Estacionamento</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(acomodacao)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleToggleStatus(acomodacao)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title={acomodacao.ativo ? 'Inativar' : 'Ativar'}
                      >
                        {acomodacao.ativo ? 
                          <ToggleRight className="h-4 w-4 text-green-600" /> : 
                          <ToggleLeft className="h-4 w-4 text-red-600" />
                        }
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default Acomodacoes