import React, { useState, useMemo } from "react";
import { Download, Calendar, BarChart3, TrendingUp, Award, DollarSign } from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { SystemState } from "../types";

interface AdminRelatoriosProps {
  state: SystemState;
}

export default function AdminRelatorios({ state }: AdminRelatoriosProps) {
  const { orders, products } = state;

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = o.date.split("T")[0];
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, startDate, endDate]);

  const stats = useMemo(() => {
    const approved = filteredOrders.filter(o => o.status === "aprovado");
    const totalRevenue = approved.reduce((acc, o) => acc + o.total, 0);
    const totalShipping = approved.reduce((acc, o) => acc + o.shippingCost, 0);
    const totalItemsCount = approved.reduce((acc, o) => acc + o.items.reduce((s, it) => s + it.quantity, 0), 0);
    const averageTicket = approved.length > 0 ? totalRevenue / approved.length : 0;

    return {
      totalRevenue,
      totalShipping,
      totalItemsCount,
      averageTicket,
      salesCount: approved.length,
      canceledCount: filteredOrders.filter(o => o.status === "cancelado").length
    };
  }, [filteredOrders]);

  // Aggregate Sales Volume per Day
  const salesByDayData = useMemo(() => {
    const approved = filteredOrders.filter(o => o.status === "aprovado");
    const dayMap: { [key: string]: number } = {};
    
    // Initialize with zeros for all days in the range so the chart is filled nicely
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    
    // Safety cap to avoid infinite loops if dates are invalid
    let count = 0;
    for (let d = new Date(start); d <= end && count < 100; d.setDate(d.getDate() + 1)) {
      count++;
      const dateStr = d.toISOString().split("T")[0];
      const dateFormatted = new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", { day: 'numeric', month: 'short' });
      dayMap[dateFormatted] = 0;
    }

    approved.forEach(o => {
      const dateStr = o.date.split("T")[0];
      const dateFormatted = new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", { day: 'numeric', month: 'short' });
      if (dayMap[dateFormatted] !== undefined) {
        dayMap[dateFormatted] += o.total;
      } else {
        // Just in case it's slightly outside but in range
        dayMap[dateFormatted] = o.total;
      }
    });

    return Object.entries(dayMap).map(([date, total]) => ({
      date,
      "Faturamento (R$)": parseFloat(total.toFixed(2))
    }));
  }, [filteredOrders, startDate, endDate]);

  // Aggregate Most Sold Products
  const topProductsData = useMemo(() => {
    const approved = filteredOrders.filter(o => o.status === "aprovado");
    const productSalesMap: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

    approved.forEach(o => {
      o.items.forEach(it => {
        if (!productSalesMap[it.productId]) {
          productSalesMap[it.productId] = {
            name: it.productName,
            quantity: 0,
            revenue: 0
          };
        }
        productSalesMap[it.productId].quantity += it.quantity;
        productSalesMap[it.productId].revenue += it.price * it.quantity;
      });
    });

    return Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(item => ({
        name: item.name.length > 20 ? item.name.substring(0, 18) + ".." : item.name,
        "Qtd Vendida": item.quantity,
        "Total (R$)": parseFloat(item.revenue.toFixed(2))
      }));
  }, [filteredOrders]);

  // Download physical PDF Report via print system
  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório Financeiro de Vendas</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 24px; color: #5A5A40; }
            .header p { margin: 5px 0 0; font-size: 12px; color: #888; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
            .stat-box { background: #fdfdfd; border: 1px solid #e2e2df; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-box p { margin: 0; font-size: 10px; text-transform: uppercase; color: #888; font-weight: bold; }
            .stat-box h2 { margin: 5px 0 0; font-size: 18px; color: #5A5A40; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th { background: #5A5A40; color: #fff; padding: 10px; text-align: left; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e2df; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MUNDO DUTRA KIDS</h1>
            <p>Relatório Consolidado de Vendas - Período: ${new Date(startDate).toLocaleDateString("pt-BR")} até ${new Date(endDate).toLocaleDateString("pt-BR")}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <p>Faturamento Geral</p>
              <h2>R$ ${stats.totalRevenue.toFixed(2)}</h2>
            </div>
            <div class="stat-box">
              <p>Pedidos Faturados</p>
              <h2>${stats.salesCount}</h2>
            </div>
            <div class="stat-box">
              <p>Ticket Médio</p>
              <h2>R$ ${stats.averageTicket.toFixed(2)}</h2>
            </div>
          </div>

          <h3>Lista de Transações faturadas</h3>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Produtos</th>
                <th class="text-right">Frete</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.filter(o => o.status === "aprovado").map(o => `
                <tr>
                  <td><strong>${o.code}</strong></td>
                  <td>${new Date(o.date).toLocaleDateString("pt-BR")}</td>
                  <td>${o.clientName}</td>
                  <td>${o.items.map(it => `${it.productName} (${it.selectedSize}) x${it.quantity}`).join("<br>")}</td>
                  <td class="text-right">R$ ${o.shippingCost.toFixed(2)}</td>
                  <td class="text-right"><strong>R$ ${o.total.toFixed(2)}</strong></td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Date controls */}
      <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm">Relatórios e Demonstrativos de Desempenho</h3>
          <p className="text-xs text-gray-500">Configure o filtro de data para baixar o PDF completo das suas vendas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
            <span className="text-[10px] uppercase font-extrabold text-gray-400">De</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs focus:outline-none bg-transparent"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
            <span className="text-[10px] uppercase font-extrabold text-gray-400">Até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs focus:outline-none bg-transparent"
            />
          </div>

          <button
            onClick={handleDownloadPDF}
            className="bg-[#5A5A40] hover:bg-[#484833] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-4 h-4" /> Baixar PDF
          </button>
        </div>
      </div>

      {/* Grid stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400">Faturamento do Período</p>
          <p className="text-2xl font-black text-[#5A5A40] mt-1">R$ {stats.totalRevenue.toFixed(2)}</p>
          <span className="text-[10px] text-green-600 font-semibold mt-1 block">Apenas pedidos aprovados</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400">Pedidos Faturados</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.salesCount}</p>
          <span className="text-[10px] text-gray-400 mt-1 block">Total arrecadado</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400">Ticket Médio do Período</p>
          <p className="text-2xl font-black text-gray-900 mt-1">R$ {stats.averageTicket.toFixed(2)}</p>
          <span className="text-[10px] text-gray-400 mt-1 block">Média por pedido</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400">Cancelados / Perdas</p>
          <p className="text-2xl font-black text-red-500 mt-1">{stats.canceledCount}</p>
          <span className="text-[10px] text-red-400 mt-1 block">Pedidos reprovados</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales per day Chart Card */}
        <div className="bg-white p-5 rounded-3xl border border-[#e0e0d6] shadow-sm space-y-4">
          <div>
            <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5A5A40]" /> Volume de Vendas por Dia
            </h4>
            <p className="text-[10px] text-gray-500">Acompanhe a curva de faturamento diário consolidado.</p>
          </div>
          
          <div className="h-64 w-full">
            {salesByDayData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BarChart3 className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-[11px]">Nenhuma venda registrada no período.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesByDayData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#5A5A40" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0ed" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 9, fill: "#888880" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: "#888880" }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 11, 
                      borderRadius: 12, 
                      backgroundColor: "#fff", 
                      border: "1px solid #e0e0d6" 
                    }} 
                    formatter={(v) => [`R$ ${parseFloat(v as string).toFixed(2)}`, "Faturamento"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Faturamento (R$)" 
                    stroke="#5A5A40" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Most sold products Chart Card */}
        <div className="bg-white p-5 rounded-3xl border border-[#e0e0d6] shadow-sm space-y-4">
          <div>
            <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-pink-500" /> Produtos Mais Vendidos (Top 5)
            </h4>
            <p className="text-[10px] text-gray-500">Ranking dos itens com maior quantidade de saída na loja.</p>
          </div>

          <div className="h-64 w-full">
            {topProductsData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BarChart3 className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-[11px]">Sem dados de produtos faturados no período.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductsData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0ed" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 9, fill: "#888880" }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: "#888880" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 11, 
                      borderRadius: 12, 
                      backgroundColor: "#fff", 
                      border: "1px solid #e0e0d6" 
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar 
                    dataKey="Qtd Vendida" 
                    fill="#ec4899" 
                    radius={[6, 6, 0, 0]} 
                    name="Unidades Vendidas"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Orders display list for download */}
      <div className="bg-white rounded-3xl border border-[#e0e0d6] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-[#fbfbfa] flex justify-between items-center text-xs">
          <span className="font-bold text-gray-700">Pedidos Faturados no Intervalo Selecionado</span>
          <span className="text-gray-400">{filteredOrders.length} transações</span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Nenhum faturamento registrado no período selecionado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-[9px] uppercase tracking-wider font-extrabold text-gray-400">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Valor de Entrega</th>
                  <th className="p-3 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-[#fbfbfa]">
                    <td className="p-3 font-extrabold text-gray-900">{o.code}</td>
                    <td className="p-3 text-gray-500">{new Date(o.date).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 text-gray-700 font-medium">{o.clientName}</td>
                    <td className="p-3 text-gray-500">R$ {o.shippingCost.toFixed(2)}</td>
                    <td className="p-3 text-right font-black text-[#5A5A40]">R$ {o.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
