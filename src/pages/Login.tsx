import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Waves } from 'lucide-react'
import Button from '../components/UI/Button'
import Input from '../components/Forms/Input'
import toast from 'react-hot-toast'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      
      toast.success('Login realizado com sucesso!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-full">
              <Waves className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pousada Parnaioca</h1>
          <p className="text-gray-600">Sistema de Gerenciamento</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
          />

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Digite sua senha"
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            Entrar
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Usuários de demonstração:</p>
          <p className="mt-1">
            <strong>Admin:</strong> admin@parnaioca.com / admin123
          </p>
          <p>
            <strong>Funcionário:</strong> funcionario@parnaioca.com / func123
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login