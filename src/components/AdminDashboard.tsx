import React, { useMemo } from "react";
import { TrendingUp, ShoppingBag, AlertTriangle, Radio, BarChart3, Users, Clock, Award } from "lucide-react";
import { SystemState } from "../types";

interface AdminDashboardProps {
  state: SystemState;
}

export default function AdminDashboard({ state }: AdminDashboardProps) {
  const { products, orders, live } = state;

  // Active metrics
  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => o.status === "aprovado")
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const approvedCount = useMemo(() => orders.filter(o => o.status === "aprovado").length, [orders]);
  const pendingCount = useMemo(() => orders.filter(o => o.status === "pendente").length, [orders]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => {
      const tot = p.sizes.reduce((acc, s) => acc + s.stock, 0);
      return tot <= 3;
    }).length;
  }, [products]);

  // Sparkline/SVG chart points
  const last7DaysData = useMemo(() => {
    const data = [
      { day: "Seg", val: 1200 },
      { day: "Ter", val: 1900 },
      { day: "Qua", val: 1400 },
      { day: "Qui", val: 2400 },
      { day: "Sex", val: 3200 },
      { day: "Sáb", val: 4100 },
      { day: "Dom", val: 3800 }
    ];
    
    // Scale points to fit a 100x40 area
    const maxVal = Math.max(...data.map(d => d.val));
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 40 - (d.val / maxVal) * 32; // stay within bounds
      return `${x},${y}`;
    }).join(" ");

    return { points, raw: data };
  }, []);

  const topSellingProducts = useMemo(() => {
    const list: { name: string; qty: number; total: number; image: string }[] = [];
    orders.filter(o => o.status === "aprovado").forEach(ord => {
      ord.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const existing = list.find(l => l.name === item.productName);
        if (existing) {
          existing.qty += item.quantity;
          existing.total += item.unitPrice * item.quantity;
        } else {
          list.push({
            name: item.productName,
            qty: item.quantity,
            total: item.unitPrice * item.quantity,
            image: prod?.image || "https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=150"
          });
        }
      });
    });
    return list.sort((a, b) => b.qty - a.qty).slice(0, 4);
  }, [orders, products]);

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Faturamento Geral</p>
            <p className="text-2xl font-black text-gray-900">R$ {totalRevenue.toFixed(2)}</p>
            <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold mt-1.5">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% vs mês anterior</span>
            </div>
          </div>
          <div className="p-3 bg-[#5A5A40]/10 text-[#5A5A40] rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Pedidos Aprovados</p>
            <p className="text-2xl font-black text-gray-900">{approvedCount}</p>
            <div className="text-[10px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{pendingCount} novos aguardando</span>
            </div>
          </div>
          <div className="p-3 bg-[#5A5A40]/10 text-[#5A5A40] rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Estoque Crítico</p>
            <p className="text-2xl font-black text-red-500">{lowStockCount}</p>
            <div className="text-[10px] text-gray-400 mt-1.5">Produtos com poucas unidades</div>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Live Shop Status</p>
            <p className={`text-xl font-bold ${live.active ? "text-red-500" : "text-gray-400"}`}>
              {live.active ? "🔴 TRANSMITINDO" : "INATIVA"}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              {live.active ? "Simulação de 142 espectadores" : "Aguardando link de live"}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${live.active ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400"}`}>
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts & Highlights Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sales Trend Chart */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-[#e0e0d6] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900">Histórico Semanal de Vendas</h3>
              <p className="text-xs text-gray-500">Fluxo de receita estimativa diária</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-[#5A5A40] px-2.5 py-1 rounded-md shadow-sm">
              R$ 2.400,00 Méd.
            </span>
          </div>

          {/* Pure CSS/SVG Area Sparkline */}
          <div className="w-full h-48 bg-[#fbfbfa] border border-[#e0e0d6]/60 rounded-2xl p-4 flex flex-col justify-between">
            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5A5A40" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#5A5A40" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Path Area */}
              <path
                d={`M 0,40 L ${last7DaysData.points} L 100,40 Z`}
                fill="url(#chartGrad)"
              />
              {/* Stroke line */}
              <polyline
                fill="none"
                stroke="#5A5A40"
                strokeWidth="1.2"
                points={last7DaysData.points}
              />
            </svg>

            {/* Labels */}
            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase mt-2 border-t border-[#f0f0e8] pt-2">
              {last7DaysData.raw.map(d => (
                <span key={d.day}>{d.day}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-3xl border border-[#e0e0d6] shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-gray-900">Mais Vendidos</h3>
            <p className="text-xs text-gray-500 font-medium">Produtos em destaque esta semana</p>
          </div>

          <div className="space-y-3.5">
            {topSellingProducts.length === 0 ? (
              <div className="text-center py-10">
                <Award className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Nenhuma venda faturada ainda.</p>
              </div>
            ) : (
              topSellingProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <img src={p.image} className="w-10 h-12 object-contain bg-white rounded-lg p-0.5 border" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-gray-900">{p.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{p.qty} unidades vendidas</p>
                  </div>
                  <span className="text-xs font-black text-[#5A5A40]">
                    R$ {p.total.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
