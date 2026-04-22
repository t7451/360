import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { ArrowLeft, Download, CheckCircle, Loader2, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { OrderDetailSkeleton } from '../components/Skeleton';
import { OrderTimeline } from '../components/OrderTimeline';

interface Order {
  id: string;
  assetType: string;
  description: string;
  status: string;
  priceUsd: number;
  priority: string;
  outputFormats: string[];
  progress?: number | null;
  assets: Array<{ id: string; filename: string; format: string; downloadUrl: string }>;
  revisions: Array<{ id: string; description: string; status: string }>;
  createdAt: string;
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const stripeStatus = searchParams.get('status'); // 'success' | 'cancelled' | null
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!id || !token) return;

    const terminalStates = ['completed', 'failed', 'refunded'];
    if (order && terminalStates.includes(order.status)) return;

    const API_BASE = import.meta.env.VITE_API_URL ?? '';
    const url = `${API_BASE}/api/orders/${id}/status/stream?token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const { status, progress } = JSON.parse(e.data);
      setOrder(prev => prev ? { ...prev, status, progress } : prev);
    };

    es.addEventListener('done', () => {
      es.close();
      fetchOrder();
    });

    es.onerror = () => {
      es.close();
      fetchOrder();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [id, token, order?.status]);

  useEffect(() => {
    if (stripeStatus === 'success' && order && order.status !== 'pending_payment') {
      toast.success('Payment confirmed! Your order is queued.');
    } else if (stripeStatus === 'cancelled') {
      toast.error('Payment cancelled');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeStatus, order?.status]);

  async function fetchOrder() {
    try {
      const data = await api.get<{ success: boolean; data: Order }>(`/api/orders/${id}`, token);
      if (data.success) setOrder(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-2xl px-6 py-12">
          <Link to="/dashboard" className="mb-8 flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <OrderDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Order not found.
      </div>
    );
  }

  const isProcessing = ['queued', 'processing', 'rendering'].includes(order.status);
  const progressPct = order.progress != null ? order.progress : order.status === 'queued' ? 15 : order.status === 'processing' ? 50 : 80;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {/* Stripe return banners */}
        {stripeStatus === 'success' && order.status !== 'pending_payment' && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <CheckCircle size={18} className="shrink-0" />
            Payment confirmed! Your asset is now in the queue.
          </div>
        )}
        {stripeStatus === 'cancelled' && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-400">
            <XCircle size={18} className="shrink-0 text-zinc-500" />
            Payment cancelled. You can retry below.
          </div>
        )}
        {stripeStatus === 'success' && order.status === 'pending_payment' && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
            <Loader2 size={18} className="animate-spin shrink-0" />
            Payment received — confirming with Stripe. Refreshing shortly...
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{order.assetType.replace(/_/g, ' ')}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
            order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
            order.status === 'failed' ? 'bg-red-500/10 text-red-400' :
            order.status === 'pending_payment' ? 'bg-yellow-500/10 text-yellow-400' :
            'bg-blue-500/10 text-blue-400'
          }`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content: 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Re-pay button if still awaiting payment */}
            {order.status === 'pending_payment' && stripeStatus !== 'success' && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                <p className="mb-3 text-sm text-zinc-400">
                  This order is awaiting payment. Complete checkout to start processing.
                </p>
                <a
                  href={`/api/orders/${order.id}/checkout`}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium hover:bg-emerald-500 transition"
                >
                  Complete Payment →
                </a>
              </div>
            )}

            {/* Progress bar for active orders */}
            {isProcessing && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 size={20} className="animate-spin text-emerald-400" />
                  <span className="text-sm text-zinc-300">Your asset is being generated...</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {order.progress != null && order.status === 'rendering' && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{order.progress}% complete</p>
                  </div>
                )}
              </div>
            )}

            {/* Order details */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-wide">Description</span>
                <p className="mt-1 text-sm text-zinc-300">{order.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Formats</span>
                  <p className="mt-1 text-sm">{order.outputFormats.join(', ').toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Price</span>
                  <p className="mt-1 text-sm font-mono">${order.priceUsd}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Priority</span>
                  <p className="mt-1 text-sm capitalize">{order.priority}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Created</span>
                  <p className="mt-1 text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Order ID</span>
                  <p className="mt-1 flex items-center gap-1 text-sm font-mono text-zinc-400">
                    {order.id}
                    <button
                      onClick={() => { navigator.clipboard.writeText(order.id); toast.success('Order ID copied'); }}
                      className="ml-1 text-zinc-500 hover:text-zinc-300 transition"
                    >
                      <Copy size={14} />
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Delivered assets */}
            {order.assets.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-400" /> Delivered Assets
                </h2>
                <div className="space-y-2">
                  {order.assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4"
                    >
                      <div>
                        <div className="text-sm font-medium">{asset.filename}</div>
                        <div className="text-xs text-zinc-500">{asset.format.toUpperCase()}</div>
                      </div>
                      <a
                        href={asset.downloadUrl}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 transition"
                      >
                        <Download size={14} /> Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: timeline */}
          <div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-400 uppercase tracking-wider">Order Progress</h3>
              <OrderTimeline currentStatus={order.status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

