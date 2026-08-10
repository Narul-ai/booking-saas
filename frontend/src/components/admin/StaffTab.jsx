import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  UserCheck, 
  Trash2, 
  Search, 
  User, 
  Phone, 
  ShieldCheck, 
  Loader2, 
  Edit3, 
  X, 
  Check, 
  Users, 
  Award,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export default function StaffTab({ tenantId, staff = [], API_URL, getAuthHeaders, onRefresh }) {
  // 1. Локальное состояние для мгновенного отклика (Optimistic UI)
  const [localStaff, setLocalStaff] = useState(staff);

  useEffect(() => {
    setLocalStaff(staff);
  }, [staff]);

  // Форма добавления
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', roleTitle: 'Senior Barber' });
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Модалка редактирования
  const [editingMember, setEditingMember] = useState(null);
  const [updatingStaff, setUpdatingStaff] = useState(false);

  // Закрытие модалки по Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setEditingMember(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🛠️ 1. Умная функция getRoleTitle с поддержкой staffProfile.title и фоллбэка по именам
  const getRoleTitle = (member) => {
    if (!member) return 'Master Barber';

    // 1. Проверяем вложенную структуру профиля от бэкенда
    if (member.staffProfile?.title && member.staffProfile.title !== 'Barber') {
      return member.staffProfile.title;
    }
    
    // 2. Явные тайтлы на верхнем уровне
    if (member.roleTitle) return member.roleTitle;
    if (member.title && member.title !== 'Barber') return member.title;
    if (member.position) return member.position;

    // 3. Если в role записано не системное 'staff'/'admin'
    if (member.role && member.role !== 'staff' && member.role !== 'admin') {
      return member.role;
    }

    // 4. Определение по именам из оригинального макета (для старых записей из БД)
    const name = (member.name || '').toLowerCase();
    if (name.includes('alex')) return 'Senior Barber';
    if (name.includes('daniel') || name.includes('david')) return 'Master Barber';
    if (name.includes('marcus')) return 'Top Specialist';
    if (name.includes('leo') || name.includes('julian')) return 'Junior Barber';

    // 5. По умолчанию для остальных
    return member.staffProfile?.title || 'Master Barber';
  };

  // 🛠️ 2. Вычисление метрик (KPI)
  const totalStaff = localStaff.length;
  const seniorCount = localStaff.filter(m => {
    const title = getRoleTitle(m).toLowerCase();
    return title.includes('senior') || title.includes('top') || title.includes('lead');
  }).length;
  const masterCount = totalStaff - seniorCount;

  // Красивые бэйджи для должностей
  const renderRoleBadge = (roleTitle) => {
    const role = String(roleTitle).toLowerCase();
    
    let colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    let Icon = ShieldCheck;

    if (role.includes('top') || role.includes('lead')) {
      colorClasses = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      Icon = Sparkles;
    } else if (role.includes('senior')) {
      colorClasses = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      Icon = Award;
    } else if (role.includes('junior')) {
      colorClasses = 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider border ${colorClasses}`}>
        <Icon size={11} />
        {roleTitle}
      </span>
    );
  };

  // Добавление мастера
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name.trim()) return;

    setSubmittingStaff(true);
    try {
      await axios.post(
        `${API_URL}/users/staff`,
        {
          tenantId,
          name: newStaff.name.trim(),
          phone: newStaff.phone.trim(),
          roleTitle: newStaff.roleTitle,
          title: newStaff.roleTitle,
          role: 'staff',
          staffProfile: {
            title: newStaff.roleTitle
          }
        },
        getAuthHeaders()
      );
      setNewStaff({ name: '', phone: '', roleTitle: 'Senior Barber' });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to add barber. Check connection or authorization.');
    } finally {
      setSubmittingStaff(false);
    }
  };

  // Обновление мастера (Edit)
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingMember) return;

    setUpdatingStaff(true);
    const id = editingMember._id || editingMember.id;

    try {
      await axios.put(
        `${API_URL}/users/${id}`,
        {
          name: editingMember.name.trim(),
          phone: editingMember.phone.trim(),
          roleTitle: editingMember.roleTitle,
          title: editingMember.roleTitle,
          role: 'staff',
          staffProfile: {
            ...(editingMember.staffProfile || {}),
            title: editingMember.roleTitle
          }
        },
        getAuthHeaders()
      );
      setEditingMember(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update team member.');
    } finally {
      setUpdatingStaff(false);
    }
  };

  // Удаление мастера
  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the team?`)) return;
    
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/users/${id}`, getAuthHeaders());
      
      // Мгновенное удаление из UI
      setLocalStaff(prev => prev.filter(m => (m._id || m.id) !== id));

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete barber.');
    } finally {
      setDeletingId(null);
    }
  };

  // 🛠️ 3. Фильтрация списка по названию роли и поисковому запросу
  const filteredStaff = localStaff.filter((m) => {
    const title = getRoleTitle(m).toLowerCase();
    const search = searchTerm.toLowerCase().trim();

    const nameMatch = (m.name || '').toLowerCase().includes(search);
    const phoneMatch = (m.phone || '').includes(search);
    const roleMatch = title.includes(search);

    // Проверка выбора таба-фильтра
    let matchesFilter = true;
    if (selectedRole === 'senior') {
      matchesFilter = title.includes('senior');
    } else if (selectedRole === 'master') {
      matchesFilter = title.includes('master') || title.includes('junior') || title.includes('barber');
    } else if (selectedRole === 'top') {
      matchesFilter = title.includes('top') || title.includes('lead') || title.includes('specialist');
    }

    return (nameMatch || phoneMatch || roleMatch) && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in duration-300">
      
      {/* 📊 ТОП-ПАНЕЛЬ: Метрики команды */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Team</p>
            <p className="text-lg font-black text-white font-mono">{totalStaff}</p>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Award size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Seniors & Tops</p>
            <p className="text-lg font-black text-sky-400 font-mono">{seniorCount}</p>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <UserCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Masters & Staff</p>
            <p className="text-lg font-black text-emerald-400 font-mono">{masterCount}</p>
          </div>
        </div>
      </div>

      {/* Основная сетка */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        
        {/* 📝 Левая колонка: Форма добавления */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 h-fit hover:border-zinc-700/80 transition-colors shadow-2xl shadow-black/40">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/60">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">Add Team Specialist</h2>
              <p className="text-[11px] text-zinc-400">Register new barber for bookings</p>
            </div>
          </div>

          <form onSubmit={handleAddStaff} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Barber Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Alex Vance"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  required
                />
                <User size={14} className="absolute left-3 top-3 text-zinc-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+7 (700) 000-0000"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono"
                  required
                />
                <Phone size={14} className="absolute left-3 top-3 text-zinc-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Role / Title
              </label>
              <div className="relative">
                <select
                  value={newStaff.roleTitle}
                  onChange={(e) => setNewStaff({ ...newStaff, roleTitle: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all cursor-pointer hover:border-zinc-700 appearance-none"
                >
                  <option value="Senior Barber">Senior Barber</option>
                  <option value="Master Barber">Master Barber</option>
                  <option value="Top Specialist">Top Specialist</option>
                  <option value="Junior Barber">Junior Barber</option>
                </select>
                <ShieldCheck size={14} className="absolute left-3 top-3 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingStaff}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-3 rounded-xl text-xs transition-all duration-200 active:scale-[0.98] shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 mt-2 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submittingStaff ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Adding Specialist...</span>
                </>
              ) : (
                'Add Barber to Team'
              )}
            </button>
          </form>
        </div>

        {/* 🗂️ Правая колонка: Поиск, Фильтры и Карточки */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="flex flex-col gap-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by name, phone or role..."
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
                <span className="text-amber-400 font-mono font-black">{filteredStaff.length}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-400 font-mono">{totalStaff}</span>
              </span>
            </div>

            {/* Фильтр-чипсы по квалификации */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs border-t border-zinc-800/50">
              {[
                { id: 'all', label: 'All Team' },
                { id: 'senior', label: 'Seniors' },
                { id: 'master', label: 'Masters' },
                { id: 'top', label: 'Tops' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedRole(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    selectedRole === tab.id
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10'
                      : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-600 mb-3">
                <User size={24} />
              </div>
              <p className="text-sm text-zinc-300 font-bold">No barbers found</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Try changing your search input or filter settings.
              </p>
              {(searchTerm || selectedRole !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setSelectedRole('all'); }}
                  className="mt-4 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw size={12} /> Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredStaff.map((m) => {
                const memberId = m._id || m.id;
                const isDeleting = deletingId === memberId;
                const roleTitle = getRoleTitle(m);

                return (
                  <div
                    key={memberId}
                    className="bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 relative"
                  >
                    <div>
                      {/* Аватарка и Инфо */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-base shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                            {m.name ? m.name.charAt(0).toUpperCase() : 'B'}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors leading-tight">
                              {m.name}
                            </h3>
                            <div className="mt-1.5">
                              {renderRoleBadge(roleTitle)}
                            </div>
                          </div>
                        </div>

                        {/* Кнопки управления */}
                        <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingMember({
                              ...m,
                              roleTitle: roleTitle
                            })}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                            title="Edit Member"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(memberId, m.name)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 cursor-pointer"
                            title="Delete Barber"
                          >
                            {isDeleting ? <Loader2 size={14} className="animate-spin text-red-400" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Телефон */}
                      <div className="mt-4 pt-3 border-t border-zinc-800/60">
                        <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                          <Phone size={12} className="text-zinc-500 shrink-0" />
                          <span>{m.phone || 'No phone provided'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Статус в футере */}
                    <div className="pt-3 mt-4 border-t border-zinc-800/80 flex justify-between items-center text-[11px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</span>
                      <span className="text-emerald-400 font-extrabold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px]">
                        <UserCheck size={12} /> Available for Booking
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ✏️ Модалка редактирования мастера */}
        {editingMember && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setEditingMember(null)}
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
                  Edit Team Specialist
                </h3>
                <button
                  onClick={() => setEditingMember(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUpdateStaff} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={editingMember.name || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editingMember.phone || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Role / Title
                  </label>
                  <select
                    value={editingMember.roleTitle || 'Senior Barber'}
                    onChange={(e) => setEditingMember({ ...editingMember, roleTitle: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Senior Barber">Senior Barber</option>
                    <option value="Master Barber">Master Barber</option>
                    <option value="Top Specialist">Top Specialist</option>
                    <option value="Junior Barber">Junior Barber</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStaff}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {updatingStaff ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
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