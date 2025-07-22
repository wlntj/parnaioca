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
import { Search, Plus, Edit, ToggleLeft, ToggleRight, UserX } from 'lucide-react'
import toast from 'react-hot-toast'

type Cliente = Database['public']['Tables']['clientes']['Row']
type ClienteInsert = Database['public']['Tables']['clientes']['Insert']

const schema = yup.object({
  nome: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  data_nascimento: yup.string().required('Data de nascimento é obrigatória'),
  cpf: yup.string().required('CPF é obrigatório').matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 000.000.000-00'),
  email: yup.string().required('E-mail é obrigatório').email('E-mail inválido'),
  telefone: yup.string().required('Telefone é obrigatório'),
  estado: yup.string().required('Estado é obrigatório').length(2, 'Estado deve ter 2 caracteres'),
  cidade: yup.string().required('Cidade é obrigatória').min(2, 'Cidade deve ter pelo menos 2 caracteres'),
})

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Cliente | null>(null)
  const { isAdmin } = useAuth()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue
  } = useForm<ClienteInsert>({
    resolver: yupResolver(schema)
  })

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome')

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      toast.error('Erro ao carregar clientes')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ClienteInsert) => {
    setSubmitting(true)
    try {
      // Verificar se CPF já existe (exceto para edição)
      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id')
        .eq('cpf', data.cpf)
        .single()

      if (existingClient && (!editingClient || existingClient.id !== editingClient.id)) {
        toast.error('CPF já cadastrado no sistema')
        return
      }

      if (editingClient) {
        const { error } = await supabase
          .from('clientes')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editingClient.id)

        if (error) throw error
        toast.success('Cliente atualizado com sucesso')
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([{ ...data, ativo: true }])

        if (error) throw error
        toast.success('Cliente cadastrado com sucesso')
      }

      reset()
      setShowForm(false)
      setEditingClient(null)
      loadClientes()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar cliente')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingClient(cliente)
    setValue('nome', cliente.nome)
    setValue('data_nascimento', cliente.data_nascimento)
    setValue('cpf', cliente.cpf)
    setValue('email', cliente.email)
    setValue('telefone', cliente.telefone)
    setValue('estado', cliente.estado)
    setValue('cidade', cliente.cidade)
    setShowForm(true)
  }

  const handleToggleStatus = async (cliente: Cliente) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem alterar o status dos clientes')
      return
    }

    try {
      const { error } = await supabase
        .from('clientes')
        .update({ ativo: !cliente.ativo, updated_at: new Date().toISOString() })
        .eq('id', cliente.id)

      if (error) throw error
      
      toast.success(`Cliente ${!cliente.ativo ? 'ativado' : 'inativado'} com sucesso`)
      loadClientes()
    } catch (error) {
      toast.error('Erro ao alterar status do cliente')
    }
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14)
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cpf.includes(searchTerm) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Carregando clientes..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-2">Gerencie os clientes da pousada</p>
          </div>
          <Button
            onClick={() => {
              reset()
              setEditingClient(null)
              setShowForm(true)
            }}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Cliente</span>
          </Button>
        </div>

        {/* Formulário */}
        {showForm && (
          <Card className="mb-6" title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome Completo"
                {...register('nome')}
                error={errors.nome?.message}
                placeholder="Digite o nome completo"
              />

              <Input
                label="Data de Nascimento"
                type="date"
                {...register('data_nascimento')}
                error={errors.data_nascimento?.message}
              />

              <Input
                label="CPF"
                {...register('cpf')}
                error={errors.cpf?.message}
                placeholder="000.000.000-00"
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value)
                  setValue('cpf', formatted)
                }}
              />

              <Input
                label="E-mail"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="cliente@email.com"
              />

              <Input
                label="Telefone"
                {...register('telefone')}
                error={errors.telefone?.message}
                placeholder="(11) 99999-9999"
              />

              <Input
                label="Estado"
                {...register('estado')}
                error={errors.estado?.message}
                placeholder="RJ"
                maxLength={2}
              />

              <Input
                label="Cidade"
                {...register('cidade')}
                error={errors.cidade?.message}
                placeholder="Angra dos Reis"
              />

              <div className="md:col-span-2 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false)
                    setEditingClient(null)
                    reset()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingClient ? 'Atualizar' : 'Cadastrar'}
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
              placeholder="Buscar por nome, CPF ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </Card>

        {/* Lista de Clientes */}
        <Card title="Lista de Clientes" subtitle={`${filteredClientes.length} cliente(s) encontrado(s)`}>
          {filteredClientes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserX className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold">CPF</th>
                    <th className="text-left py-3 px-4 font-semibold">E-mail</th>
                    <th className="text-left py-3 px-4 font-semibold">Telefone</th>
                    <th className="text-left py-3 px-4 font-semibold">Local</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{cliente.nome}</td>
                      <td className="py-3 px-4 font-mono text-sm">{cliente.cpf}</td>
                      <td className="py-3 px-4 text-sm">{cliente.email}</td>
                      <td className="py-3 px-4 text-sm">{cliente.telefone}</td>
                      <td className="py-3 px-4 text-sm">{cliente.cidade}, {cliente.estado}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cliente.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cliente.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(cliente)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleToggleStatus(cliente)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title={cliente.ativo ? 'Inativar' : 'Ativar'}
                            >
                              {cliente.ativo ? 
                                <ToggleRight className="h-4 w-4 text-green-600" /> : 
                                <ToggleLeft className="h-4 w-4 text-red-600" />
                              }
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default Clientes