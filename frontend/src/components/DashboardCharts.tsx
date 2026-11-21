import { useState } from 'react';

export interface IEvolucaoVenda {
  data: string;
  total_vendas: number;
  total_faturado: number;
}

export interface IVendaCategoria {
  categoria_id: number;
  categoria_nome: string;
  total_itens: number;
  total_faturado: number;
}

interface DashboardChartsProps {
  evolucaoVendas: IEvolucaoVenda[];
  vendasPorCategoria: IVendaCategoria[];
  carregando?: boolean;
}

export function DashboardCharts({ evolucaoVendas, vendasPorCategoria, carregando }: DashboardChartsProps) {
  const [metricaSelecionada, setMetricaSelecionada] = useState<'faturamento' | 'vendas'>('faturamento');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const formatarDataSimples = (dataStr: string) => {
    try {
      const partes = dataStr.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}`;
      }
      return dataStr;
    } catch {
      return dataStr;
    }
  };

  const maxFaturamento = Math.max(...evolucaoVendas.map(v => v.total_faturado), 100);
  const maxVendasQtd = Math.max(...evolucaoVendas.map(v => v.total_vendas), 5);
  const maxValorAtual = metricaSelecionada === 'faturamento' ? maxFaturamento : maxVendasQtd;

  const svgWidth = 650;
  const svgHeight = 240;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const faturamentoTotalCategorias = vendasPorCategoria.reduce((acc, c) => acc + c.total_faturado, 0) || 1;

  if (carregando) {
    return (
      <div className="flex justify-center items-center h-80 bg-slate-900 rounded-xl border border-slate-700/80">
        <p className="text-cyan-400 font-bold animate-pulse text-sm">Atualizando gráficos analíticos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Gráfico de Evolução Temporal */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-700/80 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Evolução de Vendas no Período</span>
            </h3>
            <p className="text-xs text-slate-400">
              Desempenho diário de acordo com o intervalo filtrado
            </p>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setMetricaSelecionada('faturamento')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                metricaSelecionada === 'faturamento'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Faturamento (R$)
            </button>
            <button
              onClick={() => setMetricaSelecionada('vendas')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                metricaSelecionada === 'vendas'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Qtd. Vendas
            </button>
          </div>
        </div>

        {evolucaoVendas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-slate-500 text-sm">
            <svg className="w-12 h-12 mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Nenhuma venda registrada no período selecionado.</span>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[500px]">
              <defs>
                <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingTop + plotHeight * (1 - ratio);
                const valorLinha = maxValorAtual * ratio;
                const textoValor =
                  metricaSelecionada === 'faturamento'
                    ? `R$ ${valorLinha >= 1000 ? (valorLinha / 1000).toFixed(1) + 'k' : Math.round(valorLinha)}`
                    : Math.round(valorLinha).toString();

                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="#334155"
                      strokeDasharray={ratio === 0 ? 'none' : '3 3'}
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="sans-serif"
                    >
                      {textoValor}
                    </text>
                  </g>
                );
              })}

              {evolucaoVendas.map((item, idx) => {
                const step = plotWidth / evolucaoVendas.length;
                const barWidth = Math.min(step * 0.6, 28);
                const x = paddingLeft + idx * step + (step - barWidth) / 2;

                const valor = metricaSelecionada === 'faturamento' ? item.total_faturado : item.total_vendas;
                const barHeight = Math.max((valor / maxValorAtual) * plotHeight, 4);
                const y = paddingTop + plotHeight - barHeight;

                const isHovered = hoverIndex === idx;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                    className="cursor-pointer transition-all"
                  >
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={isHovered ? '#38bdf8' : 'url(#cyanGradient)'}
                      className="transition-colors duration-200"
                    />

                    {(evolucaoVendas.length <= 12 || idx % Math.ceil(evolucaoVendas.length / 10) === 0) && (
                      <text
                        x={x + barWidth / 2}
                        y={svgHeight - 12}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="sans-serif"
                      >
                        {formatarDataSimples(item.data)}
                      </text>
                    )}

                    {isHovered && (
                      <circle
                        cx={x + barWidth / 2}
                        cy={y}
                        r="4"
                        fill="#ffffff"
                        stroke="#06b6d4"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {hoverIndex !== null && evolucaoVendas[hoverIndex] && (
              <div className="mt-2 text-center p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs animate-fade-in flex justify-center items-center space-x-4">
                <span className="text-slate-400">
                  Data: <strong className="text-white">{formatarDataSimples(evolucaoVendas[hoverIndex].data)}</strong>
                </span>
                <span className="text-slate-400">
                  Vendas: <strong className="text-cyan-400">{evolucaoVendas[hoverIndex].total_vendas} pedidos</strong>
                </span>
                <span className="text-slate-400">
                  Faturado: <strong className="text-emerald-400">R$ {evolucaoVendas[hoverIndex].total_faturado.toFixed(2)}</strong>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Gráfico de Vendas por Categoria */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-700/80 shadow-lg">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white">Vendas por Categoria</h3>
          <p className="text-xs text-slate-400">Distribuição da receita gerada por segmento de produto</p>
        </div>

        {vendasPorCategoria.length === 0 ? (
          <p className="text-center py-6 text-slate-500 text-sm">
            Nenhuma categoria com movimentação no período.
          </p>
        ) : (
          <div className="space-y-3.5">
            {vendasPorCategoria.map(cat => {
              const porcentagem = Math.min(100, Math.round((cat.total_faturado / faturamentoTotalCategorias) * 100));

              return (
                <div key={cat.categoria_id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300 truncate max-w-[200px]">{cat.categoria_nome}</span>
                    <span className="text-slate-400 font-mono">
                      R$ {cat.total_faturado.toFixed(2)} <span className="text-cyan-400 ml-1">({porcentagem}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 text-right">
                    {cat.total_itens} {cat.total_itens === 1 ? 'item vendido' : 'itens vendidos'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

