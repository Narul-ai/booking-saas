import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Clock, 
  DollarSign, 
  Tag, 
  Scissors, 
  Loader2, 
  Check, 
  X, 
  EyeOff,
  Sparkles,
  Smile,
  Layers,
  CheckCircle2,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

export default function ServicesTab({ tenantId, services = [], API_URL, getAuthHeaders, onRefresh }) {
  // 1. Локальное состояние для мгновенного (Optimistic) обновления UI
  const [localServices, setLocalServices] = useState(services);

  useEffect(() => {
    setLocalServices(services);
  }, [services]);

  const [newService, setNewService] = useState({ title: '', price: '', durationMinutes: 45, category: 'haircut' });
  const [submittingService, setSubmittingService] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // Поиск и фильтрация
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Модалка / Режим редактирования
  const [editingService, setEditingService] = useState(null);
  const [updatingService, setUpdatingService] = useState(false);

  // Закрытие модалки по Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setEditingService(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Хелпер для безопасного получения категории
  const getCategoryName = (s) => {
    if (!s) return 'haircut';
    const rawCat = typeof s === 'string' ? s : (s.category || s.categoryName || s.type || 'haircut');
    return String(rawCat).toLowerCase();
  };

  // Вычисление ключевых показателей (KPI) на основе localServices
  const totalCount = localServices.length;
  const activeCount = localServices.filter(s => s.isActive !== false).length;
  const disabledCount = totalCount - activeCount;
  const avgPrice = totalCount > 0 
    ? Math.round(localServices.reduce((acc, s) => acc + (Number(s.price) || 0), 0) / totalCount) 
    : 0;

  // Форматирование и иконка категории
  const renderCategoryBadge = (category) => {
    const cat = String(category).toLowerCase();
    
    let colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    let label = 'HAIRCUT';
    let Icon = Scissors;

    if (cat.includes('beard')) {
      colorClasses = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      label = 'BEARD & SHAVE';
      Icon = Tag;
    } else if (cat.includes('combo')) {
      colorClasses = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      label = 'COMBO PACKAGE';
      Icon = Sparkles;
    } else if (cat.includes('care') || cat.includes('facial')) {
      colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      label = 'FACIAL & CARE';
      Icon = Smile;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider border mb-1.5 ${colorClasses}`}>
        <Icon size={10} />
        {label}
      </span>
    );
  };

  // Добавление услуги
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.title.trim()) return;

    setSubmittingService(true);
    try {
      await axios.post(
        `${API_URL}/services`,
        {
          tenantId,
          title: newService.title.trim(),
          price: Number(newService.price) || 0,
          durationMinutes: Number(newService.durationMinutes) || 30,
          category: newService.category,
          isActive: true
        },
        getAuthHeaders()
      );
      setNewService({ title: '', price: '', durationMinutes: 45, category: 'haircut' });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to add service. Check connection or authorization.');
    } finally {
      setSubmittingService(false);
    }
  };

  // Обновление услуги (Quick Edit)
  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    setUpdatingService(true);
    const id = editingService._id || editingService.id;

    try {
      await axios.put(
        `${API_URL}/services/${id}`,
        {
          title: editingService.title.trim(),
          price: Number(editingService.price) || 0,
          durationMinutes: Number(editingService.durationMinutes) || 30,
          category: editingService.category || 'haircut',
          isActive: editingService.isActive !== false
        },
        getAuthHeaders()
      );
      setEditingService(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update service.');
    } finally {
      setUpdatingService(false);
    }
  };

  // Переключение видимости в меню (Enable / Disable) через PUT с isActive
  const handleToggleStatus = async (service) => {
    const id = service._id || service.id;
    const currentStatus = service.isActive !== false;
    const nextStatus = !currentStatus;

    // ⚡ МГНОВЕННО обновляем UI локально
    setLocalServices((prev) =>
      prev.map((item) => {
        const itemId = item._id || item.id;
        if (itemId === id) {
          return { ...item, isActive: nextStatus };
        }
        return item;
      })
    );

    try {
      await axios.put(
        `${API_URL}/services/${id}`,
        {
          title: service.title,
          price: Number(service.price),
          durationMinutes: Number(service.durationMinutes),
          category: service.category || getCategoryName(service),
          isActive: nextStatus
        },
        getAuthHeaders()
      );

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Could not update service status on server.');
      
      // Откат изменений при ошибке
      setLocalServices((prev) =>
        prev.map((item) => {
          const itemId = item._id || item.id;
          if (itemId === id) {
            return { ...item, isActive: currentStatus };
          }
          return item;
        })
      );
    }
  };

  // Удаление услуги
  const handleDeleteService = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/services/${id}`, getAuthHeaders());
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete service.');
    } finally {
      setDeletingId(null);
    }
  };

  // Фильтрация по localServices
  const filteredServices = localServices.filter((s) => {
    const cat = getCategoryName(s);
    const matchesCategory = selectedCategory === 'all' || cat.includes(selectedCategory);
    const matchesSearch = (s.title || '').toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in duration-300">
      
      {/* 📊 ТОП-ПАНЕЛЬ: Статистика каталога */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Items</p>
            <p className="text-lg font-black text-white font-mono">{totalCount}</p>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Active in Menu</p>
            <p className="text-lg font-black text-emerald-400 font-mono">{activeCount}</p>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-400 shrink-0">
            <EyeOff size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Disabled</p>
            <p className="text-lg font-black text-zinc-400 font-mono">{disabledCount}</p>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Avg. Price</p>
            <p className="text-lg font-black text-white font-mono">${avgPrice}</p>
          </div>
        </div>
      </div>

      {/* Основная сетка */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        
        {/* 📝 Левая колонка: Форма создания */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 h-fit hover:border-zinc-700/80 transition-colors shadow-2xl shadow-black/40">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/60">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">Add New Service</h2>
              <p className="text-[11px] text-zinc-400">Create item for client booking menu</p>
            </div>
          </div>

          <form onSubmit={handleAddService} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Service Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Master Beard Trim & Sculpt"
                  value={newService.title}
                  onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  required
                />
                <Scissors size={14} className="absolute left-3 top-3 text-zinc-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Category
              </label>
              <div className="relative">
                <select
                  value={newService.category}
                  onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all cursor-pointer hover:border-zinc-700 appearance-none"
                >
                  <option value="haircut">Haircut</option>
                  <option value="beard">Beard & Shaving</option>
                  <option value="combo">Combo Package</option>
                  <option value="care">Facial & Care</option>
                  <option value="other">Other</option>
                </select>
                <Tag size={14} className="absolute left-3 top-3 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Price ($)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="45"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono"
                    required
                  />
                  <DollarSign size={13} className="absolute left-3 top-3 text-zinc-500" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Duration (min)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    step="5"
                    placeholder="45"
                    value={newService.durationMinutes}
                    onChange={(e) => setNewService({ ...newService, durationMinutes: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono"
                    required
                  />
                  <Clock size={13} className="absolute left-3 top-3 text-zinc-500" />
                </div>
              </div>
            </div>

            {/* Быстрые чипсы времени */}
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 mb-1.5">Quick Duration Presets:</p>
              <div className="flex items-center gap-1.5">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setNewService({ ...newService, durationMinutes: mins })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      Number(newService.durationMinutes) === mins
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingService}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-3 rounded-xl text-xs transition-all duration-200 active:scale-[0.98] shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 mt-2 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submittingService ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving Service...</span>
                </>
              ) : (
                'Save Service to Menu'
              )}
            </button>
          </form>
        </div>

        {/* 🗂️ Правая колонка: Фильтры, Поиск и Список */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="flex flex-col gap-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search service by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2 text-zinc-500 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              
              <span className="text-[11px] font-bold text-zinc-400 px-3 py-1 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center gap-1.5">
                <span>Showing:</span>
                <span className="text-amber-400 font-mono font-black">{filteredServices.length}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-400 font-mono">{totalCount}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs border-t border-zinc-800/50">
              {[
                { id: 'all', label: 'All Services' },
                { id: 'haircut', label: 'Haircuts' },
                { id: 'beard', label: 'Beard' },
                { id: 'combo', label: 'Combos' },
                { id: 'care', label: 'Care' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    selectedCategory === tab.id
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10'
                      : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-600 mb-3">
                <Scissors size={24} />
              </div>
              <p className="text-sm text-zinc-300 font-bold">No services found</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Try resetting search filter or add a new service item to your pricing menu.
              </p>
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                  className="mt-4 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw size={12} /> Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredServices.map((s) => {
                const serviceId = s._id || s.id;
                const isDeleting = deletingId === serviceId;
                const isActive = s.isActive !== false;

                return (
                  <div
                    key={serviceId}
                    className={`bg-zinc-900/70 hover:bg-zinc-900 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 relative ${
                      isActive ? 'border-zinc-800/80 hover:border-zinc-700' : 'border-zinc-800/40 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          {renderCategoryBadge(getCategoryName(s))}
                          <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors leading-snug">
                            {s.title}
                          </h3>
                        </div>
                        <span className="text-amber-400 font-black text-base font-mono shrink-0 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                          ${s.price}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 mb-4 flex items-center gap-1.5 font-mono">
                        <Clock size={12} className="text-zinc-500" />
                        Duration: <span className="text-zinc-200 font-bold">{s.durationMinutes || 45} mins</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/80 flex justify-between items-center text-[11px]">
                      
                      {/* Тумблер статуса (Active / Hidden) */}
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className="flex items-center gap-2 group/toggle cursor-pointer"
                        title={isActive ? 'Disable in public menu' : 'Enable in public menu'}
                      >
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                          isActive 
                            ? 'bg-emerald-500/20 border border-emerald-500/40' 
                            : 'bg-red-500/20 border border-red-500/40'
                        }`}>
                          <div className={`w-3 h-3 rounded-full transition-transform duration-200 ${
                            isActive ? 'translate-x-4 bg-emerald-400' : 'translate-x-0 bg-red-500'
                          }`} />
                        </div>
                        <span className={`text-[10px] font-bold tracking-wider uppercase ${
                          isActive ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {isActive ? 'ACTIVE' : 'HIDDEN'}
                        </span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingService({
                            ...s,
                            category: getCategoryName(s)
                          })}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                          title="Edit Service"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteService(serviceId, s.title)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 cursor-pointer"
                          title="Delete Service"
                        >
                          {isDeleting ? <Loader2 size={14} className="animate-spin text-red-400" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ✏️ Модалка редактирования */}
        {editingService && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setEditingService(null)}
          >
            <div 
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-zinc-800">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Edit3 size={14} />
                  </div>
                  Edit Service
                </h3>
                <button
                  onClick={() => setEditingService(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUpdateService} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Service Title
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={editingService.title || ''}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Category
                  </label>
                  <select
                    value={editingService.category || 'haircut'}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="haircut">Haircut</option>
                    <option value="beard">Beard & Shaving</option>
                    <option value="combo">Combo Package</option>
                    <option value="care">Facial & Care</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editingService.price ?? ''}
                      onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={editingService.durationMinutes ?? ''}
                      onChange={(e) => setEditingService({ ...editingService, durationMinutes: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-zinc-500 mb-1.5">Quick Presets:</p>
                  <div className="flex items-center gap-1.5">
                    {[15, 30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setEditingService({ ...editingService, durationMinutes: mins })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          Number(editingService.durationMinutes) === mins
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingService(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingService}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {updatingService ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}