import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api, ApiError } from '../lib/api';
import { Plus, Download, Clock, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardSkeleton } from '../components/Skeleton';

const INKVAULT_URL = import.meta.env.VITE_INKVAULT_URL || 'https://inkvault.netlify.app';

interface Order {
  id: string;
  assetType: string;
  description: string;
  status: string;
  priceUsd: number;
  assets: Array<{ id: string; filename: string; format: string; downloadUrl: string }>;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_payment: { label: 'Awaiting Payment', color: 'text-yellow-400', icon: <Clock size={14} /> },
  queued: { label: 'Queued', color: 'text-blue-400', icon: <Loader2 size={14} className="animate-spin" /> },
  processing: { label: 'Processing', color: 'text-blue-400', icon: <Loader2 size={14} className="animate-spin" /> },
  rendering: { label: 'Rendering', color: 'text-purple-400', icon: <Loader2 size={14} className="animate-spin" /> },
  completed: { label: 'Completed', color: 'text-emerald-400', icon: <CheckCircle size={14} /> },
  failed: { label: 'Failed', color: 'text-red-400', icon: <AlertCircle size={14} /> },
};

export function Dashboard() {
  const { token, user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const data = await api.get<{ success: boolean; data: Order[] }>('/api/orders', token);
      if (data.success) setOrders(data.data);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        console.error('Failed to fetch orders:', err);
        toast.error('Failed to load orders. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-900 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-tight">
            <span className="text-emerald-400">FORGE</span>3D
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{user?.email}</span>
            <button onClick={() => { logout(); toast.success('Signed out'); }} className="text-sm text-zinc-500 hover:text-white transition">Log out</button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* InkVault Banner */}
        <a
          href={INKVAULT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 flex items-center gap-4 rounded-xl border border-purple-800/50 bg-purple-950/30 px-5 py-4 transition hover:border-purple-700 hover:bg-purple-950/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-900/60">
            <Sparkles size={20} className="text-purple-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-purple-200">Explore InkVault — AI Tattoo Design Studio</p>
            <p className="text-sm text-purple-400/80">Browse 133+ curated flash designs, stencil tools, placement guides & artist directory</p>
          </div>
          <span className="shrink-0 text-xs text-purple-400">Visit →</span>
        </a>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Orders</h1>
            <p className="mt-1 text-sm text-zinc-500">{orders.length} total</p>
          </div>
          <Link
            to="/orders/new"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium hover:bg-emerald-500 transition"
          >
            <Plus size={16} /> New Order
          </Link>
        </div>

        {/* Orders List */}
        {loading ? (
          <DashboardSkeleton />
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 py-20 text-center">
            <p className="text-zinc-500">No orders yet.</p>
            <Link to="/orders/new" className="mt-3 inline-block text-sm text-emerald-400 hover:underline">
              Create your first order →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.processing;
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {order.assetType.replace(/_/g, ' ')}
                      </span>
                      <span className={`flex items-center gap-1 text-xs ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500 truncate">{order.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-zinc-300">${order.priceUsd}</div>
                    <div className="text-xs text-zinc-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {order.assets.length > 0 && (
                    <Download size={16} className="text-emerald-400 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
