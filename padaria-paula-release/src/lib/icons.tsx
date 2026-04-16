// Ícones customizados para a Padaria Paula
// Baseados em Lucide React

import {
  Home,
  ShoppingCart,
  History,
  Settings,
  ChefHat,
  Plus,
  Minus,
  Trash2,
  Printer,
  Package,
  User,
  Phone,
  MapPin,
  FileText,
  Search,
  X,
  Check,
  AlertCircle,
  Clock,
  CheckCircle,
  Truck,
  Edit,
  Save,
  RefreshCw,
  Filter,
  Download,
  Eye,
  Copy,
  Store,
  Contact,
  Hash,
  DollarSign,
  Scale,
  Tag,
  List,
  Grid,
  ArrowLeft,
  ArrowRight,
  UtensilsCrossed,
  Cookie,
  Cake,
  Croissant,
  type LucideIcon,
} from "lucide-react";

// Re-exportar todos os ícones
export {
  Home,
  ShoppingCart,
  History,
  Settings,
  ChefHat,
  Plus,
  Minus,
  Trash2,
  Printer,
  Package,
  User,
  Phone,
  MapPin,
  FileText,
  Search,
  X,
  Check,
  AlertCircle,
  Clock,
  CheckCircle,
  Truck,
  Edit,
  Save,
  RefreshCw,
  Filter,
  Download,
  Eye,
  Copy,
  Store,
  Contact,
  Hash,
  DollarSign,
  Scale,
  Tag,
  List,
  Grid,
  ArrowLeft,
  ArrowRight,
  UtensilsCrossed,
  Cookie,
  Cake,
  Croissant,
  type LucideIcon,
};

// Ícone de padaria customizado
export const BakeryIcon = ChefHat;

// Ícones por categoria de produto
export const categoriaIcons: Record<string, LucideIcon> = {
  Tortas: Cake,
  Docinhos: Cookie,
  Salgadinhos: UtensilsCrossed,
  Pães: Croissant,
  Bolos: Cake,
  default: Package,
};

// Ícones por status de pedido
export const statusIcons: Record<string, LucideIcon> = {
  PENDENTE: Clock,
  PRODUCAO: ChefHat,
  PRONTO: CheckCircle,
  ENTREGUE: Truck,
};

// Cores por status de pedido
export const statusColors: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800 border-yellow-300",
  PRODUCAO: "bg-blue-100 text-blue-800 border-blue-300",
  PRONTO: "bg-green-100 text-green-800 border-green-300",
  ENTREGUE: "bg-gray-100 text-gray-800 border-gray-300",
};

// Labels por status de pedido
export const statusLabels: Record<string, string> = {
  PENDENTE: "Pendente",
  PRODUCAO: "Em Produção",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
};
