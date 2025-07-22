import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only create client if we have valid configuration
export const supabase = (supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  supabaseAnonKey.length > 20)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          nome: string
          data_nascimento: string
          cpf: string
          email: string
          telefone: string
          estado: string
          cidade: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clientes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>
      }
      tipos_acomodacao: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          ativo: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tipos_acomodacao']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tipos_acomodacao']['Insert']>
      }
      acomodacoes: {
        Row: {
          id: string
          nome: string
          numero: string
          valor_diaria: number
          capacidade_maxima: number
          tipo_id: string
          tem_frigobar: boolean
          tem_estacionamento: boolean
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['acomodacoes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['acomodacoes']['Insert']>
      }
      itens_frigobar: {
        Row: {
          id: string
          nome: string
          valor: number
          ativo: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['itens_frigobar']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['itens_frigobar']['Insert']>
      }
      hospedagens: {
        Row: {
          id: string
          cliente_id: string
          acomodacao_id: string
          data_checkin: string
          data_checkout: string | null
          valor_diaria: number
          status: 'checkin' | 'checkout' | 'cancelado'
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['hospedagens']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['hospedagens']['Insert']>
      }
      consumo_frigobar: {
        Row: {
          id: string
          hospedagem_id: string
          item_id: string
          quantidade: number
          valor_unitario: number
          valor_total: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['consumo_frigobar']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['consumo_frigobar']['Insert']>
      }
      logs_alteracoes: {
        Row: {
          id: string
          usuario_id: string
          tabela: string
          operacao: 'INSERT' | 'UPDATE' | 'DELETE'
          registro_id: string
          dados_anteriores: any | null
          dados_novos: any | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['logs_alteracoes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['logs_alteracoes']['Insert']>
      }
    }
  }
}