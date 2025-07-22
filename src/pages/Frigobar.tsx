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
import { Search, Plus, Edit, ToggleLeft, ToggleRight, Refrigerator } from 'lucide-react'
import toast from 'react-hot-toast'

type ItemFrigobar = Database['public']['Tables']['itens_frigobar']['Row']
type ItemFrigobarInsert = Database['public']['Tables']['itens_frigobar']['Insert']

const schema = yup.object({
  nome: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  valor: yup.number().required('Valor é obrigatório').min(0, 'Valor deve ser positivo'),
})

const Frigobar: React.FC = () => {
  const [itens, setItens] = useState<ItemFrigobar[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemFrigobar | null>(null)
  const { isAdmin } = useAuth()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue
  } = useForm<ItemFrigobarInsert>({
    resolver: yupResolver(schema)
  })

  useEffect(() => {
    loadItens()
  }, [])

  const loadItens = async () => {
    try {
      if (!supabase) {
        // Mock data para demonstração
        setItens([
          {
            id: '1',
            nome: 'Água Mineral 500ml',
            valor: 3.50,
            ativo: true,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            nome: 'Refrigerante Coca-Cola 350ml',
            valor: 5.00,
            ativo: true,
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            nome: 'Cerveja Heineken 330ml',
            valor: 8.00,
            ativo: true,
            created_at: new Date().toISOString()
          },
          {
            id: '4',
            nome: 'Suco de Laranja 300ml',
            valor: 4.50,
            ativo: true,
            created_at: new Date().toISOString()
          },
          {
            id: '5',
            nome: 'Chocolate Nestlé',
            valor: 6.00,
            ativo: true,
            created_at: new Date().toISOString()
          }
        ])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('itens_frigobar')
        .select('*')
        .order('nome')

      if (error) throw error
      setItens(data || [])
    } catch (error) {
      toast.error('Erro ao carregar itens do frigobar')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ItemFrigobarInsert) => {
    setSubmitting(true)
    try {
      if (!supabase) {
        // Mock para demonstração
        const newItem = {
          id: Date.now().toString(),
          ...data,
          ativo: true,
          created_at: new Date().toISOString()
        }
        
        if (editingItem) {
          setItens(prev => prev.map(i => 
            i.id === editingItem.id ? { ...newItem, id: editingItem.id } : i
          ))
          toast.success('Item atualizado com sucesso')
        } else {
          setItens(prev => [...prev, newItem])
          toast.success('Item cadastrado com sucesso')
        }
        
        reset()
        setShowForm(false)
        setEditingItem(null)
        return
      }

      if (editingItem) {
        const { error } = await supabase
          .from('itens_frigobar')
          .update(data)
          .eq('id', editingItem.id)

        if (error) throw error
        toast.success('Item atualizado com sucesso')
      } else {
        const { error } = await supabase
          .from('itens_frigobar')
          .insert([{ ...data, ativo: true }])

        if (error) throw error
        toast.success('Item cadastrado com sucesso')
      }

      reset()
      setShowForm(false)
      setEditingItem(null)
      loadItens()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: ItemFrigobar) => {
    setEditingItem(item)
    setValue('nome', item.nome)
    setValue('valor', item.valor)
    setShowForm(true)
  }

  const handleToggleStatus = async (item: ItemFrigobar) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem alterar o status dos itens')
      return
    }

    try {
      if (!supabase) {
        setItens(prev => prev.map(i => 
          i.id === item.id ? { ...i, ativo: !i.ativo } : i
        ))
        toast.success(`Item ${!item.ativo ? 'ativado' : 'inativado'} com sucesso`)
        return
      }

      const { error } = await supabase
        .from('itens_frigobar')
        .update({ ativo: !item.ativo })
        .eq('id', item.id)

      if (error) throw error
      
      toast.success(`Item ${!item.ativo ? 'ativado' : 'inativado'} com sucesso`)
      loadItens()
    } catch (error) {
      toast.error('Erro ao alterar status do item')
    }
  }

  const filteredItens = itens.filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Carregando itens do frigobar..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Frigobar</h1>
            <p className="text-gray-600 mt-2">Gerencie os itens disponíveis no frigobar</p>
          </div>
          <Button
            onClick={() => {
              reset()
              setEditingItem(null)
              setShowForm(true)
            }}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Item</span>
          </Button>
        </div>

        {/* Formulário */}
        {showForm && (
          <Card className="mb-6" title={editingItem ? 'Editar Item' : 'Novo Item'}>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome do Item"
                {...register('nome')}
                error={errors.nome?.message}
                placeholder="Ex: Água Mineral 500ml"
              />

              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                {...register('valor')}
                error={errors.valor?.message}
                placeholder="3.50"
              />

              <div className="md:col-span-2 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false)
                    setEditingItem(null)
                    reset()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingItem ? 'Atualizar' : 'Cadastrar'}
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
              placeholder="Buscar itens do frigobar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </Card>

        {/* Lista */}
        <Card title="Itens do Frigobar" subtitle={`${filteredItens.length} item(ns) encontrado(s)`}>
          {filteredItens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Refrigerator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum item encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItens.map((item) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-lg border hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm">{item.nome}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-lg font-bold text-blue-600">
                      R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title={item.ativo ? 'Inativar' : 'Ativar'}
                      >
                        {item.ativo ? 
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

export default Frigobar