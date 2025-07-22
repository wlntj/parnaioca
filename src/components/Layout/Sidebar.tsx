import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Users, 
  Building, 
  Bed, 
  ShoppingCart, 
  Car, 
  ClipboardCheck, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  Waves
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
      toast.success('Logout realizado com sucesso')
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: Building, label: 'Tipos de Acomodação', path: '/tipos-acomodacao' },
    { icon: Bed, label: 'Acomodações', path: '/acomodacoes' },
    { icon: ShoppingCart, label: 'Frigobar', path: '/frigobar' },
    { icon: Car, label: 'Estacionamento', path: '/estacionamento' },
    { icon: ClipboardCheck, label: 'Check-in/out', path: '/checkin' },
    { icon: FileText, label: 'Relatórios', path: '/relatorios' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  ]

  if (isAdmin) {
    menuItems.push({ icon: Settings, label: 'Administração', path: '/admin' })
  }

  return (
    <div className={`bg-gradient-to-b from-blue-900 to-blue-800 text-white h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-blue-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Waves className="h-8 w-8 text-blue-300" />
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold">Parnaioca</h1>
                <p className="text-xs text-blue-200">Sistema de Gestão</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-blue-700/50">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-3 py-3 text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </div>
  )
}

export default Sidebar