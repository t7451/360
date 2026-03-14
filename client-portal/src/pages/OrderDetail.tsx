import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Download, Clock, CheckCircle, Loader2 } from 'lucide-react';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    // Poll for status updates every 10s if order is in progress
    const interval = setInterval(() => {
      if (order && !['completed', 'failed'].includes(order.status)) {
        fetchOrder();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [id]);

  async function fetchOrder() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOrder(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="animate-spin mr-2" /> Loading...
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{order.assetType.replace(/_/g, ' ')}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
            order.status === 'failed' ? 'bg-red-500/10 text-red-400' :
            'bg-blue-500/10 text-blue-400'
          }`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Progress bar for active orders */}
        {isProcessing && (
          <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 size={20} className="animate-spin text-emerald-400" />
              <span className="text-sm text-zinc-300">Your asset is being generated...</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                style={{ width: order.status === 'queued' ? '15%' : order.status === 'processing' ? '50%' : '80%' }}
              />
            </div>
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
          </div>
        </div>

        {/* Delivered assets */}
        {order.assets.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400" /> Delivered Assets
            </h2>
            <div className="space-y-2">
              {order.assets.map((asset: any) => (
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
    </div>
  );
}
