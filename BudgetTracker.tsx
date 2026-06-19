import React, { useState } from 'react';
import { BudgetStats } from './types';

interface BudgetTrackerProps {
  stats: BudgetStats;
  onReset: () => void;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ stats, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Cost Rates
  const INPUT_RATE_PER_TOKEN = 1.25 / 1000000; // $1.25 per 1M tokens
  const OUTPUT_RATE_PER_TOKEN = 5.00 / 1000000; // $5.00 per 1M tokens
  const IMAGE_RATE = 0.030; // $0.03 per image

  // Calculations
  const inputCost = stats.inputTokens * INPUT_RATE_PER_TOKEN;
  const outputCost = stats.outputTokens * OUTPUT_RATE_PER_TOKEN;
  const imageCost = stats.imagesCount * IMAGE_RATE;
  const totalCost = inputCost + outputCost + imageCost;

  const formatCost = (val: number) => {
    return val === 0 ? '$0.00' : `$${val.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 5 })}`;
  };

  return (
    <>
      {/* Floating Retro Comic Badge */}
      <div 
        id="budget-badge"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-[90] cursor-pointer group flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black px-3 py-2 rounded-lg font-comic text-lg md:text-xl shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-[1px_1px_0px_#000] select-none"
        title="Consommation API & Budget"
      >
        <div className="text-xl md:text-2xl animate-pulse">💰</div>
        <div className="flex flex-col items-start leading-none pr-1">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 font-sans">API BUDGET</span>
          <span className="text-sm md:text-md uppercase font-comic tracking-wide">
            {totalCost === 0 ? '$0.00' : `$${totalCost.toFixed(3)}`}
          </span>
        </div>
      </div>

      {/* Ledger Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-2xl bg-[#FFFDF0] border-8 border-black rounded-xl shadow-[10px_10px_0px_rgba(0,0,0,1)] flex flex-col p-6 md:p-8 overflow-hidden max-h-[90vh]"
          >
            {/* Dots Background Decoration */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-radial-dots" />

            {/* Comic Banner Title */}
            <div className="relative bg-red-600 text-white text-center border-4 border-black py-3 px-6 mb-6 rotate-[-1deg] shadow-[5px_5px_0px_#000] rounded">
              <h2 className="font-comic text-2xl md:text-4xl tracking-wide uppercase">
                📓 LIVRE DE COMPTES API • API LEDGER
              </h2>
              <p className="text-yellow-300 text-xs font-mono uppercase tracking-widest mt-1">
                Estimated Costs & token usage tracker
              </p>
            </div>

            {/* Close Button with Retro "X" Style */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 bg-black text-white hover:bg-red-600 border-4 border-black w-10 h-10 flex items-center justify-center font-comic text-2xl shadow-[2px_2px_0px_#fff] hover:scale-105 active:scale-95 transition-transform z-10"
              title="Close Ledger"
            >
              ✕
            </button>

            {/* Account Ledger Content (Notebook look) */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative border-4 border-black bg-[#FFFEEB] p-4 rounded-lg shadow-inner">
              {/* Ledger Margin Double Border Red Line */}
              <div className="absolute left-[3.5rem] top-0 bottom-0 border-l-2 border-double border-red-500 pointer-events-none opacity-40 hidden md:block" />
              
              <div className="space-y-6">
                
                {/* Ledger Intro Statement */}
                <div className="border-b-2 border-black pb-2 mb-4">
                  <span className="text-xs uppercase text-gray-400 font-mono">Date: {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <p className="text-sm font-comic text-black/75 tracking-wider uppercase mt-1">
                    Statistiques de consommation de jetons et images Gemini & Imagen
                  </p>
                </div>

                {/* Main Table Layout */}
                <div className="font-mono text-xs md:text-sm text-black space-y-4">
                  
                  {/* Category: Text/Récit Generation */}
                  <div className="border-2 border-black bg-white rounded p-3 shadow-[3px_3px_0px_#000]">
                    <div className="flex justify-between items-center text-red-600 border-b-2 border-black pb-1 mb-2">
                      <span className="font-comic text-lg uppercase tracking-wide">✍️ GÉNÉRATEUR DE RÉCITS (Gemini Text)</span>
                      <span className="font-bold">{stats.textRequestsCount} REQ</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded">
                        <span>Jetons d'Entrée (Input Tokens)</span>
                        <div className="text-right">
                          <span className="font-bold block">{stats.inputTokens.toLocaleString()} tkn</span>
                          <span className="text-[10px] text-gray-500 block">@ $1.25/M = {formatCost(inputCost)}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded">
                        <span>Jetons de Sortie (Output Tokens)</span>
                        <div className="text-right">
                          <span className="font-bold block">{stats.outputTokens.toLocaleString()} tkn</span>
                          <span className="text-[10px] text-gray-500 block">@ $5.00/M = {formatCost(outputCost)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category: Image Generation */}
                  <div className="border-2 border-black bg-white rounded p-3 shadow-[3px_3px_0px_#000]">
                    <div className="flex justify-between items-center text-blue-600 border-b-2 border-black pb-1 mb-2">
                      <span className="font-comic text-lg uppercase tracking-wide">🎨 GÉNÉRATEUR D'IMAGES (Imagen/GenAI)</span>
                      <span className="font-bold">{stats.imagesCount} IMG</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded">
                      <span>Rendus d'images (Images Generated)</span>
                      <div className="text-right">
                        <span className="font-bold block">{stats.imagesCount}</span>
                        <span className="text-[10px] text-gray-500 block">@ $0.030/img = {formatCost(imageCost)}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Total Balance Sheet section */}
                <div className="bg-yellow-100 border-4 border-black p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <div>
                    <span className="font-comic text-xl text-black block tracking-wider uppercase">BALANCE DE CONSOMMATION</span>
                    <span className="text-xs text-black/60 uppercase font-sans font-bold">Estimated Accrued Expenses (USD)</span>
                  </div>
                  <div className="font-comic text-4xl text-black text-right tracking-tight select-all">
                    {formatCost(totalCost)}
                  </div>
                </div>

                {/* Footer notes & details */}
                <div className="text-[10px] text-black/60 leading-relaxed font-sans mt-4 border-t border-black/20 pt-3">
                  <p className="font-bold uppercase tracking-wider mb-1">📢 À propos des tarifs / About Pricing:</p>
                  <p>
                    • Coûts estimés basés sur les tarifs officiels de l'API Google Gemini 2.5 Flash / 3.0 Pro. Les jetons d'entrée sont facturés à 1,25 $ par million, et les jetons de sortie à 5,00 $ par million. La génération d'images de haute qualité est estimée à 0,03 $ par image.
                  </p>
                  <p className="mt-1">
                    • Les statistiques d'utilisation du budget sont cryptées localement et conservées en toute sécurité dans l'historique du navigateur (localStorage).
                  </p>
                </div>

              </div>
            </div>

            {/* Action Buttons: Reset & Close */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <button 
                onClick={(e) => { e.stopPropagation(); onReset(); }}
                className="comic-btn w-full sm:w-auto bg-red-500 hover:bg-red-400 text-white font-comic text-lg px-6 py-2.5 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 duration-100 rounded"
              >
                <span>🔄</span> RECETTES À ZÉRO / RESET STATS
              </button>

              <button 
                onClick={() => setIsOpen(false)}
                className="comic-btn w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-comic text-lg px-8 py-2.5 transform hover:scale-105 active:scale-95 duration-100 rounded"
              >
                ✕ FERMER / CLOSE
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
