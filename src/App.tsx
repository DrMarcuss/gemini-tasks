import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, CheckCircle2, Circle, Sparkles, AlertCircle 
} from 'lucide-react';

// ==========================================
// 🏗️ ТИПЫ ДАННЫХ (БЕЗ ЛИШНИХ СТРОК)
// ==========================================

// Приоритеты: 1, 2, 3
type TaskPriority = 1 | 2 | 3;

// Структура задачи (минимальная, чтобы не ругался)
interface Task {
  id: number;
  title: string;
  is_completed: boolean;
  priority: TaskPriority;
  created_at: string;
}

// Цвета для приоритетов
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  1: 'border-green-500/20 bg-green-500/10 text-green-400',
  2: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
  3: 'border-red-500/20 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]'
};

// Иконки
const PRIORITY_ICONS: Record<TaskPriority, string> = {
  1: '🌱',
  2: '⚡',
  3: '🔥'
};

// ==========================================
// 🧠 ГЛАВНЫЙ КОМПОНЕНТ
// ==========================================

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. ЗАГРУЗКА
  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('priority', { ascending: false }) 
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Приводим данные к нашему типу (защита от ошибок TS)
      const typedData = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        is_completed: item.is_completed,
        priority: item.priority || 1, // Если в базе null, будет 1
        created_at: item.created_at
      })) as Task[];

      setTasks(typedData);
    } catch (err: any) {
      console.error(err);
      setError('Ошибка загрузки.');
    } finally {
      setLoading(false);
    }
  }

  // 2. ДОБАВЛЕНИЕ
  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;

    const tempId = Date.now();
    const tempTask: Task = {
      id: tempId,
      title: newTask,
      is_completed: false,
      priority: priority,
      created_at: new Date().toISOString()
    };

    setTasks(prev => [tempTask, ...prev].sort((a, b) => b.priority - a.priority));
    setNewTask('');
    setPriority(1);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          title: newTask, 
          priority: priority,
          is_completed: false 
        }])
        .select();

      if (error) throw error;

      if (data) {
        setTasks(prev => prev.map(t => t.id === tempId ? {
            ...t, 
            id: data[0].id,
            priority: data[0].priority || t.priority
        } : t));
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка сохранения!');
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  }

  // 3. ПЕРЕКЛЮЧЕНИЕ СТАТУСА
  async function toggleTask(id: number, currentStatus: boolean) {
    setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));

    try {
      await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', id);
    } catch (err) {
      console.error(err);
      setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: currentStatus } : t));
    }
  }

  // 4. УДАЛЕНИЕ
  async function deleteTask(id: number) {
    if (!confirm('Удалить?')) return;
    const oldTasks = tasks;
    setTasks(tasks.filter(t => t.id !== id));

    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (err) {
      alert('Ошибка удаления');
      setTasks(oldTasks);
    }
  }

  // ==========================================
  // 🎨 ОТРИСОВКА
  // ==========================================
  return (
    <div className="w-full max-w-xl relative z-10 px-4 py-10">
      
      {/* Заголовок */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent inline-flex items-center gap-3 drop-shadow-2xl">
          Gemini Tasks <Sparkles className="text-yellow-400 w-8 h-8 animate-pulse" />
        </h1>
      </motion.div>

      {/* Форма */}
      <form onSubmit={addTask} className="relative mb-8 group glass-panel rounded-2xl p-2 flex gap-2 transition-all hover:border-cyan-500/50">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Новая задача..."
          className="flex-1 bg-transparent border-none text-white text-lg placeholder-slate-500 focus:outline-none px-4 py-2"
        />
        
        <div className="flex items-center gap-1 bg-slate-900/50 rounded-xl p-1">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p as TaskPriority)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                priority === p 
                  ? 'bg-slate-700 shadow-lg scale-110 ring-1 ring-white/20' 
                  : 'opacity-40 hover:opacity-100 hover:bg-slate-800'
              }`}
            >
              <span className="text-lg">{PRIORITY_ICONS[p as TaskPriority]}</span>
            </button>
          ))}
        </div>

        <button type="submit" className="w-12 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white flex items-center justify-center">
          <Plus size={24} />
        </button>
      </form>

      {/* Ошибки */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertCircle /> {error}
        </div>
      )}

      {/* Список */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`p-4 rounded-xl border flex items-center gap-4 transition-all group relative overflow-hidden ${
                task.is_completed 
                  ? 'bg-slate-900/40 border-slate-800 opacity-50 grayscale' 
                  : `glass-panel ${PRIORITY_COLORS[task.priority]} border-opacity-30`
              }`}
            >
              {task.priority === 3 && !task.is_completed && (
                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
              )}

              <button onClick={() => toggleTask(task.id, task.is_completed)} className="relative z-10 text-current opacity-70 hover:opacity-100">
                {task.is_completed ? <CheckCircle2 size={26} className="text-green-500" /> : <Circle size={26} />}
              </button>
              
              <div className="flex-1 relative z-10">
                <span className={`text-lg font-medium block ${task.is_completed ? 'line-through opacity-70' : 'text-slate-100'}`}>
                  {task.title}
                </span>
                
                {!task.is_completed && (
                  <div className="flex items-center gap-2 text-xs opacity-70 mt-1 uppercase tracking-wider font-bold">
                     {task.priority === 3 && <span className="text-red-400">🔥 Высокий</span>}
                     {task.priority === 2 && <span className="text-yellow-400">⚡ Средний</span>}
                     {task.priority === 1 && <span className="text-green-400">🌱 Низкий</span>}
                  </div>
                )}
              </div>

              <button 
                onClick={() => deleteTask(task.id)} 
                className="relative z-10 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all text-slate-500 hover:text-red-400"
              >
                <Trash2 size={20} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {!loading && tasks.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-lg text-slate-300">Список пуст 😴</p>
          </div>
        )}
      </div>
    </div>
  );
}
