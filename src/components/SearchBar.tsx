import React, { useState } from 'react';
import { Search, Sparkles, X, ArrowRight, Tag } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, category?: string) => void;
  isLoading: boolean;
  currentQuery: string;
}

const CATEGORIES = [
  { name: 'Perfumes', icon: '✨', sample: 'Perfume Dior Sauvage' },
  { name: 'Beleza', icon: '💄', sample: 'Secador Taiff Fox Ion' },
  { name: 'Eletrônicos', icon: '📱', sample: 'iPhone 15' },
  { name: 'Casa', icon: '🏠', sample: 'Air Fryer Mondial' },
];

const POPULAR_SEARCHES = [
  'Dior Sauvage',
  'iPhone 15 128GB',
  'Air Fryer Mondial 4L',
  'Secador Taiff Fox Ion 3',
  'Malbec Gold O Boticário',
  'Kindle 11ª Geração',
  'Fone JBL Tune 520BT',
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading,
  currentQuery,
}) => {
  const [searchTerm, setSearchTerm] = useState(currentQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim(), selectedCategory || undefined);
    }
  };

  const handleCategoryClick = (catName: string, sample: string) => {
    if (selectedCategory === catName) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(catName);
      setSearchTerm(sample);
      onSearch(sample, catName);
    }
  };

  const handleChipClick = (term: string) => {
    setSearchTerm(term);
    onSearch(term);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedCategory(null);
  };

  return (
    <div className="w-full">
      {/* Main Search Input Form */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center bg-[#0C152B] border-2 border-slate-700/80 focus-within:border-lime-400 rounded-2xl shadow-2xl shadow-black/40 transition-all p-1.5 sm:p-2">
          <div className="pl-3 pr-2 text-slate-400">
            <Search className="w-5 h-5 text-slate-400" />
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o nome do produto (ex: Dior Sauvage, iPhone 15, Air Fryer Mondial)..."
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base px-2 py-2 focus:outline-none font-medium"
            disabled={isLoading}
          />

          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors mr-1"
              title="Limpar pesquisa"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className="flex items-center gap-2 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 disabled:hover:bg-lime-400 text-slate-950 font-bold px-5 sm:px-7 py-3 rounded-xl transition-all shadow-lg shadow-lime-400/20 shrink-0 text-sm sm:text-base cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <span>Buscar produtos</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Categories */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-lime-400" /> Categorias sugeridas:
        </span>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => handleCategoryClick(cat.name, cat.sample)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                isSelected
                  ? 'bg-lime-400/20 border-lime-400 text-lime-300 shadow-sm'
                  : 'bg-[#0E1833] border-slate-700/80 text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Popular Quick Searches */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <span className="text-[11px] text-slate-400 font-medium">Exemplos rápidos:</span>
        {POPULAR_SEARCHES.map((query) => (
          <button
            key={query}
            type="button"
            onClick={() => handleChipClick(query)}
            className="bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white px-2.5 py-1 rounded-md transition-colors text-[11px] font-medium border border-slate-700/40"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
};
