import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  Settings,
  Menu,
  X,
  TrendingUp,
  FileDown,
  Smartphone,
  Calendar,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: ShoppingCart, label: 'Vendas', path: '/vendas' },
  { icon: Package, label: 'Estoque', path: '/estoque' },
  { icon: Calendar, label: 'Agendamentos', path: '/agendamentos' },
  { icon: TrendingUp, label: 'Relatórios', path: '/relatorios' },
  { icon: Smartphone, label: 'WhatsApp', path: '/whatsapp' },
  { icon: FileDown, label: 'Exportar', path: '/exportar' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={cn(
      "bg-card border-r border-border transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-primary">VendaCRM</h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                isCollapsed && "justify-center"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "text-xs text-muted-foreground",
          isCollapsed && "text-center"
        )}>
          {isCollapsed ? "v1.0" : "VendaCRM v1.0"}
        </div>
      </div>
    </div>
  );
};