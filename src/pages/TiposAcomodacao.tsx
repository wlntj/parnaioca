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
import { Search, Plus, Edit, ToggleLeft, ToggleRight, Building } from 'lucide-react'
import toast from 'react-hot-toast'

type TipoAcomodacao = Database['public']['Tables']['tipos_acomodacao']['Row']
type TipoAcomodacaoInsert = Database['public']['Tables']['tipos_acomodacao']['Insert']

const schema = yup.object({
  nome: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: yup.string().nullable(),
})

const TiposAcomodacao: React.FC = () => {
  const [tipos, setTipos] = useState<TipoAcomodacao[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoAcomodacao | null>(null)
  const { isAdmin } = useAuth()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue
  } = useForm<TipoAcomodacaoInsert>({
    resolver: yupResolver(schema)
  })

  useEffect(() => {
    loadTipos()
  }, [])

  const loadTipos = async () => {
    try {
      if (!supabase) {
        // Mock data para demonstração
        setTipos([
          {
            id: '1',
            nome: 'Suíte',
            descricao: 'Acomodação luxuosa com vista para o mar',
            ativo: true,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            nome: 'Apartamento',
            descricao: 'Acomodação confortável para famílias',
            ativo: true,
            created_at: new Date().toISOString()
          }
        ])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('tipos_acomodacao')
        .select('*')
        .order('nome')

      if (error) throw error
      setTipos(data || [])
    } catch (error) {
      toast.error('Erro ao carregar tipos de acomodação')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: TipoAcomodacaoInsert) => {
    setSubmitting(true)
    try {
      if (!supabase) {
        // Mock para demonstração
        const newTipo = {
          id: Date.now().toString(),
          ...data,
          ativo: true,
          created_at: new Date().toISOString()
        }
        
        if (editingTipo) {
          setTipos(prev => prev.map(t => t.id === editingTipo.id ? { ...newTipo, id: editingTipo.id } : t))
          toast.success('Tipo de acomodação atualizado com sucesso')
        } else {
          setTipos(prev => [...prev, newTipo])
          toast.success('Tipo de acomodação cadastrado com sucesso')
        }
        
        reset()
        setShowForm(false)
        setEditingTipo(null)
        return
      }

      if (editingTipo) {
        const { error } = await supabase
          .from('tipos_acomodacao')
          .update(data)
          .eq('id', editingTipo.id)

        if (error) throw error
        toast.success('Tipo de acomodação atualizado com sucesso')
      } else {
        const { error } = await supabase
          .from('tipos_acomodacao')
          .insert([{ ...data, ativo: true }])

        if (error) throw error
        toast.success('Tipo de acomodação cadastrado com sucesso')
      }

      reset()
      setShowForm(false)
      setEditingTipo(null)
      loadTipos()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar tipo de acomodação')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (tipo: TipoAcomodacao) => {
    setEditingTipo(tipo)
    setValue('nome', tipo.nome)
    setValue('descricao', tipo.descricao)
    setShowForm(true)
  }

  const handleToggleStatus = async (tipo: TipoAcomodacao) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem alterar o status')
      return
    }

    try {
      if (!supabase) {
        // Mock para demonstração
        setTipos(prev => prev.map(t => 
          t.id === tipo.id ? { ...t, ativo: !t.ativo } : t
        ))
        toast.success(`Tipo ${!tipo.ativo ? 'ativado' : 'inativado'} com sucesso`)
        return
      }

      const { error } = await supabase
        .from('tipos_acomodacao')
        .update({ ativo: !tipo.ativo })
        .eq('id', tipo.id)

      if (error) throw error
      
      toast.success(`Tipo ${!tipo.ativo ? 'ativado' : 'inativado'} com sucesso`)
      loadTipos()
    } catch (error) {
      toast.error('Erro ao alterar status')
    }
  }

  const filteredTipos = tipos.filter(tipo =>
    tipo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tipo.descricao && tipo.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Carregando tipos de acomodação..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tipos de Acomodação</h1>
            <p className="text-gray-600 mt-2">Gerencie os tipos de acomodação da pousada</p>
          </div>
          <Button
            onClick={() => {
              reset()
              setEditingTipo(null)
              setShowForm(true)
            }}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Tipo</span>
          </Button>
        </div>

        {/* Formulário */}
        {showForm && (
          <Card className="mb-6" title={editingTipo ? 'Editar Tipo' : 'Novo Tipo'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nome do Tipo"
                {...register('nome')}
                error={errors.nome?.message}
                placeholder="Ex: Suíte, Apartamento"
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  {...register('descricao')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={3}
                  placeholder="Descrição opcional do tipo de acomodação"
                />
                {errors.descricao && <p className="mt-1 text-sm text-red-600">{errors.descricao.message}</p>}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false)
                    setEditingTipo(null)
                    reset()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingTipo ? 'Atualizar' : 'Cadastrar'}
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
              placeholder="Buscar tipos de acomodação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </Card>

        {/* Lista */}
        <Card title="Tipos de Acomodação" subtitle={`${filteredTipos.length} tipo(s) encontrado(s)`}>
          {filteredTipos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum tipo de acomodação encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTipos.map((tipo) => (
                <div key={tipo.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">{tipo.nome}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tipo.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tipo.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  {tipo.descricao && (
                    <p className="text-sm text-gray-600 mb-3">{tipo.descricao}</p>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(tipo)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleToggleStatus(tipo)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title={tipo.ativo ? 'Inativar' : 'Ativar'}
                      >
                        {tipo.ativo ? 
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

export default TiposAcomodacao