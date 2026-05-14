import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  LayoutDashboard, 
  StickyNote, 
  Settings, 
  Plus, 
  Moon, 
  Sun,
  Trash2,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Calendar as CalendarIcon,
  ListTodo,
  Tag,
  FolderOpen,
  Clock,
  MapPin,
  ChevronLeft,
  Timer,
  Bot,
  Send,
  Loader2,
  Terminal,
  User,
  Award,
  Zap,
  Activity
} from 'lucide-react';

// --- Types ---
interface UserProfile {
  name: string;
  email: string;
  bio: string;
  level: number;
  streak: number;
  lastProductiveDate?: string; // ISO date string YYYY-MM-DD
}
interface AIAction {
  type: 'CREATE_TASK' | 'CREATE_EVENT' | 'CREATE_NOTE' | 'CHAT_RESPONSE';
  payload: any;
}
interface Task {
  id: string;
  text: string;
  description: string;
  completed: boolean;
  createdAt: number;
  tags: string[];
  folderId: string;
  dueDate?: string;
}

interface TaskFolder {
  id: string;
  name: string;
  color: string;
}

interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location: string;
  tags: string[];
  description: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

interface FutureNote {
  content: string;
  updatedAt: number;
}

interface FocusSettings {
  duration: number; // in minutes
}

const DEFAULT_FOLDERS: TaskFolder[] = [
  { id: 'all', name: 'All Tasks', color: 'bg-blue-500' },
  { id: 'work', name: 'Work', color: 'bg-purple-500' },
  { id: 'personal', name: 'Personal', color: 'bg-green-500' },
];

// --- Main App ---
export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'calendar' | 'notes' | 'profile' | 'assistant'>('dashboard');
  const [isDarkMode] = useState(true);
  const [theme, setTheme] = useState<'blue' | 'rose'>('blue');
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folders, setFolders] = useState<TaskFolder[]>(DEFAULT_FOLDERS);
  const [events, setEvents] = useState<Event[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [futureNote, setFutureNote] = useState<FutureNote>({ content: '', updatedAt: 0 });
  const [focusSettings, setFocusSettings] = useState<FocusSettings>({ duration: 25 });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'New User',
    email: 'user@example.com',
    bio: 'Focused on the next small win.',
    level: 1,
    streak: 0
  });

  // Persistence & Streak Logic
  useEffect(() => {
    const savedData = {
      tasks: localStorage.getItem('momentum_tasks'),
      folders: localStorage.getItem('momentum_folders'),
      events: localStorage.getItem('momentum_events'),
      notes: localStorage.getItem('momentum_notes'),
      future: localStorage.getItem('momentum_future'),
      themeMode: localStorage.getItem('momentum_theme_mode'),
      themeColor: localStorage.getItem('momentum_theme_color'),
      focus: localStorage.getItem('momentum_focus'),
      profile: localStorage.getItem('momentum_profile'),
    };

    if (savedData.tasks) setTasks(JSON.parse(savedData.tasks));
    if (savedData.folders) setFolders(JSON.parse(savedData.folders));
    if (savedData.events) setEvents(JSON.parse(savedData.events));
    if (savedData.notes) setNotes(JSON.parse(savedData.notes));
    if (savedData.future) setFutureNote(JSON.parse(savedData.future));
    if (savedData.themeColor) setTheme(savedData.themeColor as 'blue' | 'rose');
    if (savedData.focus) setFocusSettings(JSON.parse(savedData.focus));
    
    if (savedData.profile) {
      const profile: UserProfile = JSON.parse(savedData.profile);
      
      // Check for streak reset (if they missed a day)
      const today = new Date().toISOString().split('T')[0];
      const lastDate = profile.lastProductiveDate;
      
      if (lastDate && lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // If last productive day wasn't yesterday, reset streak
        if (lastDate !== yesterdayStr) {
          profile.streak = 0;
        }
      }
      setUserProfile(profile);
    }
  }, []);

  // Update streak when tasks are completed
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // We consider it "100% productive" if there are tasks and they are all done
    const allDone = tasks.length > 0 && tasks.every(t => t.completed);
    
    if (allDone && userProfile.lastProductiveDate !== today) {
      setUserProfile(prev => ({
        ...prev,
        streak: prev.streak + 1,
        lastProductiveDate: today
      }));
    }
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('momentum_tasks', JSON.stringify(tasks));
    localStorage.setItem('momentum_folders', JSON.stringify(folders));
    localStorage.setItem('momentum_events', JSON.stringify(events));
    localStorage.setItem('momentum_notes', JSON.stringify(notes));
    localStorage.setItem('momentum_future', JSON.stringify(futureNote));
    localStorage.setItem('momentum_theme_mode', 'true');
    localStorage.setItem('momentum_theme_color', theme);
    localStorage.setItem('momentum_focus', JSON.stringify(focusSettings));
    localStorage.setItem('momentum_profile', JSON.stringify(userProfile));
    
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.setAttribute('data-theme', theme);
  }, [tasks, folders, events, notes, futureNote, isDarkMode, theme, focusSettings, userProfile]);

  const handleAIActions = (actions: AIAction[]) => {
    actions.forEach(action => {
      switch (action.type) {
        case 'CREATE_TASK':
          const newTask: Task = {
            id: crypto.randomUUID(),
            text: action.payload.text || 'Imported Task',
            description: action.payload.description || '',
            completed: false,
            createdAt: Date.now(),
            folderId: action.payload.folderId || 'personal',
            tags: action.payload.tags || [],
          };
          setTasks(prev => [newTask, ...prev]);
          break;
        case 'CREATE_EVENT':
          let startT = action.payload.startTime || '09:00';
          let endT = action.payload.endTime;
          if (!endT && action.payload.startTime) {
             const parts = action.payload.startTime.split(':');
             if (parts.length === 2) {
               const h = parseInt(parts[0], 10);
               const m = parts[1];
               endT = `${String((h + 1) % 24).padStart(2, '0')}:${m}`;
             } else {
               endT = '10:00';
             }
          } else if (!endT) {
             endT = '10:00';
          }
          const newEvent: Event = {
            id: crypto.randomUUID(),
            title: action.payload.title || 'New Event',
            date: action.payload.date || new Date().toISOString().split('T')[0],
            startTime: startT,
            endTime: endT,
            location: action.payload.location || '',
            tags: [],
            description: action.payload.description || ''
          };
          setEvents(prev => [...prev, newEvent]);
          break;
        case 'CREATE_NOTE':
          const newNote: Note = {
            id: crypto.randomUUID(),
            title: action.payload.title || 'Imported Note',
            content: action.payload.content || '',
            createdAt: Date.now()
          };
          setNotes(prev => [newNote, ...prev]);
          break;
      }
    });
  };

  // Progress Logic
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen font-sans dark bg-[#0A0A0A]">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-10">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000 ${theme === 'blue' ? 'bg-blue-400' : 'bg-rose-400'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000 ${theme === 'blue' ? 'bg-purple-400' : 'bg-pink-400'}`} />
      </div>

      <main className="relative max-w-lg mx-auto pt-10 pb-24 px-6 min-h-screen">
        <header className="mb-8 items-center text-center sm:text-left">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Momentum Organiser</h1>
            <p className="text-gray-400 text-sm mt-1">
              Ready for your next milestone?
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard">
              <Dashboard 
                tasks={tasks} 
                events={events} 
                focusSettings={focusSettings} 
                setFocusSettings={setFocusSettings} 
              />
            </motion.div>
          )}
          {activeTab === 'tasks' && (
            <motion.div key="tasks">
              <AdvancedTasks 
                tasks={tasks} 
                setTasks={setTasks} 
                folders={folders} 
                setFolders={setFolders} 
              />
            </motion.div>
          )}
          {activeTab === 'calendar' && (
            <motion.div key="calendar">
              <CalendarView 
                events={events} 
                setEvents={setEvents} 
              />
            </motion.div>
          )}
          {activeTab === 'notes' && (
            <motion.div key="notes">
              <NotesView 
                notes={notes} 
                setNotes={setNotes}
                futureNote={futureNote} 
                setFutureNote={setFutureNote} 
              />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div key="profile">
              <ProfileView 
                theme={theme}
                setTheme={setTheme}
                focusSettings={focusSettings} 
                setFocusSettings={setFocusSettings} 
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                tasks={tasks}
                events={events}
              />
            </motion.div>
          )}
          {activeTab === 'assistant' && (
            <motion.div key="assistant">
              <AssistantView 
                tasks={tasks}
                events={events}
                notes={notes}
                onExecuteActions={handleAIActions}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-gray-200 dark:border-white/10 pb-safe z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center h-20 px-4">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Home" 
          />
          <NavButton 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')} 
            icon={<ListTodo className="w-5 h-5" />} 
            label="Tasks" 
          />
          <NavButton 
            active={activeTab === 'assistant'} 
            onClick={() => setActiveTab('assistant')} 
            icon={<Bot className="w-6 h-6" />} 
            label="AI" 
          />
          <NavButton 
            active={activeTab === 'calendar'} 
            onClick={() => setActiveTab('calendar')} 
            icon={<CalendarIcon className="w-5 h-5" />} 
            label="Events" 
          />
          <NavButton 
            active={activeTab === 'notes'} 
            onClick={() => setActiveTab('notes')} 
            icon={<StickyNote className="w-5 h-5" />} 
            label="Notes" 
          />
          <NavButton 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
            icon={<User className="w-5 h-5" />} 
            label="Profile" 
          />
        </div>
      </nav>
    </div>
  );
}

// --- Sub-components ---

function Dashboard({ tasks, events, focusSettings, setFocusSettings }: {
  tasks: Task[];
  events: Event[];
  focusSettings: FocusSettings;
  setFocusSettings: (s: FocusSettings) => void;
}) {
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.date === today);

  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [customMinutes, setCustomMinutes] = useState(focusSettings.duration.toString());
  const [timeLeft, setTimeLeft] = useState(focusSettings.duration * 60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerState === 'running' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && timerState === 'running') {
      setTimerState('idle');
    }
    return () => clearInterval(timer);
  }, [timerState, timeLeft]);

  const toggleFocus = () => {
    if (timerState === 'idle') {
      if (timeLeft === 0) resetTimer();
      setTimerState('running');
    } else if (timerState === 'running') {
      setTimerState('paused');
    } else if (timerState === 'paused') {
      setTimerState('running');
    }
  };

  const resetTimer = () => {
    setTimerState('idle');
    const mins = parseInt(customMinutes) || 25;
    setTimeLeft(mins * 60);
  };

  const handleCustomTimeChange = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    setCustomMinutes(num);
    if (num && timerState === 'idle') {
      const mins = parseInt(num);
      setTimeLeft(mins * 60);
      setFocusSettings({ duration: mins });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      {/* Progress Card */}
      <section className="glass rounded-[3rem] p-8 shadow-sm">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest font-mono">Today's Productivity</span>
            <h3 className="text-4xl font-bold dark:text-white mt-1 tabular-nums">{progressPercent}%</h3>
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/10"
          >
            <TrendingUp className="w-5 h-5 text-brand-accent" />
          </motion.div>
        </div>
        <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="h-full bg-brand-accent"
          />
        </div>
        <div className="flex justify-between mt-4">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{completedTasks} Completed</span>
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{tasks.length - completedTasks} Remaining</span>
        </div>
      </section>

      {/* Focus Hub */}
      <section className="space-y-4">
        <div className="glass rounded-[2rem] p-6 relative overflow-hidden group">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-brand-accent/5 p-3 rounded-2xl">
                 <Timer className="w-6 h-6 text-brand-accent" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Set Your Session (Minutes)</h4>
                <div className="flex items-center gap-3">
                  <div className={`relative px-4 py-1.5 rounded-2xl bg-gray-100 dark:bg-white/5 transition-all ${timerState !== 'idle' ? 'opacity-50 ring-0' : 'ring-2 ring-brand-accent shadow-xl shadow-brand-accent/10'}`}>
                    <input 
                      type="text"
                      value={timerState !== 'idle' ? formatTime(timeLeft).split(':')[0] : customMinutes}
                      onChange={(e) => handleCustomTimeChange(e.target.value)}
                      disabled={timerState !== 'idle'}
                      placeholder="25"
                      className="w-14 bg-transparent text-4xl font-bold dark:text-white focus:outline-none tabular-nums text-center placeholder:opacity-20"
                    />
                  </div>
                  <div className="flex flex-col">
                    {timerState === 'idle' ? (
                      <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mt-1">Focus Ready</span>
                    ) : (
                      <span className="text-4xl font-bold dark:text-white tabular-nums -mt-2">:{formatTime(timeLeft).split(':')[1]}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={resetTimer}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-transparent"
              >
                Reset
              </button>
              <button 
                onClick={toggleFocus}
                className={`flex-1 sm:flex-none px-10 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${timerState === 'running' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'}`}
              >
                {timerState === 'running' ? 'Pause' : timerState === 'paused' ? 'Resume' : 'Start'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Agenda */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Today's Agenda</h3>
        <div className="space-y-3">
          {todayEvents.length === 0 ? (
            <div className="glass rounded-3xl p-6 text-center">
              <p className="text-xs text-gray-400 italic">Clear skies for today.</p>
            </div>
          ) : (
            todayEvents.map(event => (
              <div key={event.id} className="glass rounded-3xl p-4 flex items-center gap-4 relative overflow-hidden">
                <div className="w-1.5 h-10 bg-brand-accent rounded-full shrink-0" />
                <div className="overflow-hidden">
                   <h5 className="font-bold text-xs dark:text-white truncate" title={event.title}>{event.title}</h5>
                   <p className="text-[10px] text-gray-500 mt-0.5">{event.startTime} - {event.endTime}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
}

function AssistantView({ tasks, events, notes, onExecuteActions }: {
  tasks: Task[];
  events: Event[];
  notes: Note[];
  onExecuteActions: (actions: AIAction[]) => void;
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: "I'm your Productivity Assistant. Tell me what's on your mind—tasks, events, or thoughts—and I'll organize it for you instantly." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useState<HTMLDivElement | null>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/momentum-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMsg,
          context: {
            currentDate: new Date().toISOString().split('T')[0],
            currentTime: new Date().toLocaleTimeString(),
            taskCount: tasks.length,
            eventCount: events.length,
            noteCount: notes.length,
            recentTasks: tasks.slice(0, 5).map(t => t.text)
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get AI response");
      }

      const data = await response.json();
      
      if (data.actions) {
        onExecuteActions(data.actions);
        const chatResponse = data.actions.find((a: any) => a.type === 'CHAT_RESPONSE');
        const itemsCreated = data.actions.filter((a: any) => a.type !== 'CHAT_RESPONSE').length;
        
        let assistantText = chatResponse?.payload?.message || "I've updated your workspace based on your request.";
        if (itemsCreated > 0) {
          assistantText += ` (Added ${itemsCreated} item${itemsCreated > 1 ? 's' : ''})`;
        }
        
        setMessages(prev => [...prev, { role: 'assistant', text: assistantText }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: error.message || "Sorry, I had trouble processing that. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex flex-col h-[70vh]">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-brand-accent flex items-center justify-center text-white shadow-lg shadow-brand-accent/20">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold dark:text-white">Productivity AI</h2>
          <p className="text-[10px] text-brand-accent font-bold uppercase tracking-widest">Always Ready</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide pb-4">
        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-brand-accent text-white rounded-tr-none shadow-lg shadow-brand-accent/10' 
                : 'glass dark:text-white rounded-tl-none font-medium'
            }`}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass p-4 rounded-[1.5rem] rounded-tl-none">
              <Loader2 className="w-5 h-5 text-brand-accent animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 relative">
        <input 
          placeholder="New task: Gym at 6pm..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="w-full glass rounded-[2rem] p-5 pr-16 bg-white/5 dark:bg-white/10 focus:bg-white/20 focus:outline-none dark:text-white text-gray-900 transition-all shadow-sm"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-brand-accent flex items-center justify-center text-white shadow-lg shadow-brand-accent/20 active:scale-90 transition-all disabled:opacity-50 disabled:grayscale"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
         <div className="flex items-center gap-1.5 opacity-40">
           <Terminal className="w-3 h-3 dark:text-white" />
           <span className="text-[9px] font-bold dark:text-white uppercase tracking-widest">Organizing Enabled</span>
         </div>
      </div>
    </motion.div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button onClick={onClick} className="relative flex flex-col items-center justify-center w-16 h-full transition-all group">
      <div className={`transition-all duration-300 ${active ? 'text-brand-accent -translate-y-1' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-tight mt-1 transition-all ${active ? 'text-brand-accent opacity-100' : 'opacity-0 group-hover:opacity-40 text-gray-500'}`}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="activeNav"
          className="absolute -top-1 w-1 h-1 bg-brand-accent rounded-full"
        />
      )}
    </button>
  );
}

function AdvancedTasks({ tasks, setTasks, folders, setFolders }: {
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  folders: TaskFolder[];
  setFolders: (f: TaskFolder[]) => void;
}) {
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ text: '', desc: '', folder: 'all', tags: '' });

  const filteredTasks = selectedFolder === 'all' ? tasks : tasks.filter(t => t.folderId === selectedFolder);

  const handleAdd = () => {
    if (!newTask.text) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: newTask.text,
      description: newTask.desc,
      completed: false,
      createdAt: Date.now(),
      folderId: newTask.folder === 'all' ? 'personal' : newTask.folder,
      tags: newTask.tags.split(',').map(t => t.trim()).filter(t => t),
    };
    setTasks([task, ...tasks]);
    setNewTask({ text: '', desc: '', folder: 'all', tags: '' });
    setIsAdding(false);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Task Vault</h2>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-brand-accent text-white p-2.5 rounded-2xl shadow-lg shadow-brand-accent/20"
        >
          {isAdding ? <Plus className="w-6 h-6 rotate-45 transition-transform" /> : <Plus className="w-6 h-6" />}
        </motion.button>
      </header>

      {/* Folders List */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
        {folders.map(folder => (
          <button 
            key={folder.id} 
            onClick={() => setSelectedFolder(folder.id)}
            className={`shrink-0 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${selectedFolder === folder.id ? 'bg-brand-accent border-brand-accent text-white shadow-md' : 'glass border-transparent text-gray-500 dark:text-gray-400'}`}
          >
            {folder.name}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-[2.5rem] p-6 space-y-4 border border-brand-accent/20"
          >
            <input 
              placeholder="What needs to be done?" 
              value={newTask.text} 
              autoFocus
              onChange={e => setNewTask({...newTask, text: e.target.value})}
              className="w-full bg-transparent font-bold text-xl focus:outline-none dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700"
            />
            <textarea 
              placeholder="Add some context or details..." 
              value={newTask.desc}
              onChange={e => setNewTask({...newTask, desc: e.target.value})}
              className="w-full bg-transparent text-sm focus:outline-none dark:text-white resize-none h-20 scrollbar-hide"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><FolderOpen className="w-3.5 h-3.5" /> Folder</label>
                <select 
                  value={newTask.folder} 
                  onChange={e => setNewTask({...newTask, folder: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-xs p-2.5 focus:outline-none dark:text-white appearance-none cursor-pointer"
                >
                  {folders.map(f => <option key={f.id} value={f.id} className="dark:bg-black">{f.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Tags</label>
                <input 
                  placeholder="e.g. urgent, soon" 
                  value={newTask.tags}
                  onChange={e => setNewTask({...newTask, tags: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-xs p-2.5 focus:outline-none dark:text-white"
                />
              </div>
            </div>
            <button onClick={handleAdd} className="w-full bg-brand-accent text-white py-4 rounded-[2rem] font-bold text-sm shadow-xl shadow-brand-accent/20 active:scale-[0.98] transition-transform">
              Create Task
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3.5">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-gray-400 italic text-sm"
            >
              This folder is empty. Time to dream big!
            </motion.p>
          ) : (
            filteredTasks.map(task => (
              <motion.div 
                key={task.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`glass rounded-[2rem] p-5 flex items-start gap-4 transition-all duration-300 border border-transparent hover:border-brand-accent/10 ${task.completed ? 'opacity-50 grayscale' : 'shadow-sm'}`}
              >
                <button 
                  onClick={() => setTasks(tasks.map(t => t.id === task.id ? {...t, completed: !t.completed} : t))}
                  className="mt-1 transition-transform active:scale-90"
                >
                  {task.completed ? <CheckCircle2 className="w-7 h-7 text-green-500" /> : <Circle className="w-7 h-7 text-gray-300 dark:text-gray-700" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-[15px] dark:text-white ${task.completed ? 'line-through' : ''}`}>{task.text}</p>
                  {task.description && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{task.description}</p>}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className={`text-[9px] px-2.5 py-1 rounded-full text-white font-bold tracking-tight ${folders.find(f => f.id === task.folderId)?.color || 'bg-gray-400'}`}>
                      {folders.find(f => f.id === task.folderId)?.name}
                    </span>
                    {task.tags.map(tag => (
                      <span key={tag} className="text-[9px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium">#{tag}</span>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function CalendarView({ events, setEvents }: { 
  events: Event[]; 
  setEvents: (e: Event[]) => void; 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', start: '09:00', end: '10:00', loc: '', desc: '' });

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const selectedDateEvents = events.filter(e => e.date === selectedDate);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleAddEvent = () => {
    if (!newEvent.title) return;
    const event: Event = {
      id: crypto.randomUUID(),
      title: newEvent.title,
      date: selectedDate,
      startTime: newEvent.start,
      endTime: newEvent.end,
      location: newEvent.loc,
      tags: [],
      description: newEvent.desc
    };
    setEvents([...events, event]);
    setNewEvent({ title: '', start: '09:00', end: '10:00', loc: '', desc: '' });
    setIsAdding(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <header className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-bold dark:text-white capitalize">{monthName}</h2>
          <p className="text-xs font-mono text-gray-500 tracking-widest mt-0.5">{currentDate.getFullYear()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="glass p-2.5 rounded-xl active:scale-95 transition-transform"><ChevronLeft className="w-5 h-5 dark:text-white" /></button>
          <button onClick={nextMonth} className="glass p-2.5 rounded-xl active:scale-95 transition-transform"><ChevronRight className="w-5 h-5 dark:text-white" /></button>
        </div>
      </header>

      {/* Calendar Grid */}
      <section className="glass rounded-[2.5rem] p-5 shadow-sm">
        <div className="grid grid-cols-7 gap-1.5">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-gray-400 py-2">{d}</div>
          ))}
          {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const hasEvents = events.some(e => e.date === dateStr);
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <button 
                key={dayNum} 
                onClick={() => setSelectedDate(dateStr)}
                className={`relative aspect-square rounded-2xl text-xs font-bold transition-all flex items-center justify-center ${isSelected ? 'bg-brand-accent text-white scale-110 shadow-lg shadow-blue-500/30 z-10' : 'hover:bg-gray-100 dark:hover:bg-white/5 dark:text-white'}`}
              >
                {dayNum}
                {isToday && !isSelected && <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-red-400" />}
                {hasEvents && !isSelected && <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-brand-accent/40" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Agenda for Selected Day */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-3">
            <CalendarIcon className="w-4 h-4 text-brand-accent" />
            {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
          </h3>
          <button onClick={() => setIsAdding(!isAdding)} className="text-xs font-bold text-brand-accent hover:underline decoration-2 underline-offset-4">
            {isAdding ? 'Close' : 'Add Event'}
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="glass rounded-[2rem] p-7 space-y-5 border border-brand-accent/10">
               <input autoFocus placeholder="Event Name" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full bg-transparent font-bold text-xl focus:outline-none dark:text-white" />
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Starts</label>
                   <input type="time" value={newEvent.start} onChange={e => setNewEvent({...newEvent, start: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 p-3 rounded-xl text-xs dark:text-white focus:ring-1 ring-brand-accent" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ends</label>
                   <input type="time" value={newEvent.end} onChange={e => setNewEvent({...newEvent, end: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 p-3 rounded-xl text-xs dark:text-white focus:ring-1 ring-brand-accent" />
                 </div>
               </div>
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</label>
                 <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 p-3 rounded-xl">
                   <MapPin className="w-4 h-4 text-gray-400" />
                   <input placeholder="Where is this happening?" value={newEvent.loc} onChange={e => setNewEvent({...newEvent, loc: e.target.value})} className="w-full bg-transparent text-xs focus:outline-none dark:text-white" />
                 </div>
               </div>
               <button onClick={handleAddEvent} className="w-full bg-brand-accent text-white py-4 rounded-[2rem] font-bold text-sm shadow-xl shadow-brand-accent/20 active:scale-95 transition-transform">
                 Plan Event
               </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3.5">
          <AnimatePresence mode="popLayout">
            {selectedDateEvents.length === 0 ? (
               <div className="text-center py-10 text-gray-400 text-sm italic">Nothing on the radar.</div>
            ) : (
              selectedDateEvents.map(event => (
                <motion.div 
                  key={event.id} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className="glass rounded-3xl p-5 flex justify-between items-center group border border-white/5"
                >
                  <div className="flex items-center gap-5 overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex flex-col items-center justify-center shrink-0 border border-brand-accent/5">
                      <span className="text-xs font-bold text-brand-accent leading-none">{event.startTime.split(':')[0]}</span>
                      <span className="text-[9px] text-brand-accent uppercase font-mono font-bold opacity-60 mt-1">{event.startTime.split(':')[1]}</span>
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-sm dark:text-white truncate" title={event.title}>{event.title}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                        <span>{event.startTime} - {event.endTime}</span>
                        {event.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEvents(events.filter(e => e.id !== event.id))} 
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
}

function NotesView({ notes, setNotes, futureNote, setFutureNote }: { 
  notes: Note[]; 
  setNotes: (n: Note[]) => void;
  futureNote: FutureNote;
  setFutureNote: (fn: FutureNote) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const addNote = (title: string, content: string) => {
    const newNote = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Future Self Section - Expanded */}
      <section className="relative p-10 rounded-[3rem] bg-brand-primary text-white overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10">
          <Sparkles className="w-16 h-16 text-blue-400 opacity-10 animate-pulse" />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-serif italic mb-5 leading-tight">To your future self...</h2>
          <textarea 
            value={futureNote.content}
            onChange={(e) => setFutureNote({ content: e.target.value, updatedAt: Date.now() })}
            placeholder="Write why you're choosing the hard path today. This is for the person you're becoming."
            className="w-full bg-transparent border-none focus:ring-0 text-gray-300 placeholder:text-gray-700 text-lg leading-relaxed h-44 resize-none italic font-serif scrollbar-hide"
          />
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
              {futureNote.updatedAt ? `Perspective Locked: ${new Date(futureNote.updatedAt).toLocaleDateString()}` : 'Your story begins here'}
            </span>
          </div>
        </div>
      </section>

      {/* General Notes */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Thought Repository</h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-xs font-bold text-brand-accent hover:underline decoration-2 underline-offset-4"
          >
            {isAdding ? 'Cancel' : 'Add Thought'}
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-[2rem] p-6 space-y-4 border border-brand-accent/10"
            >
              <input 
                type="text" 
                placeholder="Subject"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-transparent font-bold text-lg focus:outline-none dark:text-white"
              />
              <textarea 
                placeholder="Detailed thought process..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-transparent text-sm min-h-[140px] focus:outline-none dark:text-white resize-none scrollbar-hide"
              />
              <button 
                onClick={() => {
                  if (newContent) {
                    addNote(newTitle || 'Untitled Thought', newContent);
                    setNewTitle('');
                    setNewContent('');
                    setIsAdding(false);
                  }
                }}
                className="w-full py-4 bg-brand-accent text-white rounded-[2rem] text-sm font-bold shadow-xl shadow-blue-500/10 active:scale-95 transition-transform"
              >
                Archive Thought
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-4">
          {notes.map(note => (
            <motion.div 
              key={note.id}
              layout
              className="glass rounded-[2rem] p-6 group group-hover:shadow-md transition-all border border-transparent hover:border-brand-accent/5"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-[15px] dark:text-white leading-tight">{note.title}</h4>
                <button 
                  onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 p-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-4 leading-relaxed font-medium">
                {note.content}
              </p>
              <div className="mt-5 text-[10px] text-gray-400 flex items-center gap-2 font-mono uppercase tracking-widest font-bold">
                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                <span className="text-gray-200 dark:text-gray-800">•</span>
                <span>{Math.ceil(note.content.length / 5)} units</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function ProfileView({ 
  theme,
  setTheme,
  focusSettings, 
  setFocusSettings,
  userProfile,
  setUserProfile,
  tasks,
  events
}: { 
  theme: 'blue' | 'rose';
  setTheme: (t: 'blue' | 'rose') => void;
  focusSettings: FocusSettings;
  setFocusSettings: (s: FocusSettings) => void;
  userProfile: UserProfile;
  setUserProfile: (up: UserProfile) => void;
  tasks: Task[];
  events: Event[];
}) {
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editBio, setEditBio] = useState(userProfile.bio);
  const [editEmail, setEditEmail] = useState(userProfile.email);

  const handleSaveProfile = () => {
    setUserProfile({
      ...userProfile,
      name: editName,
      bio: editBio,
      email: editEmail
    });
    setIsEditing(false);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-8 pb-10"
    >
      {/* Profile Header */}
      <section className="glass rounded-[3rem] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 pt-6 opacity-30 flex gap-2 z-20">
           <button 
             onClick={() => setIsEditing(!isEditing)}
             className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-500/10 hover:bg-brand-accent/20 transition-colors text-gray-500 hover:text-brand-accent shadow-sm"
           >
              {isEditing ? <CheckCircle2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
           </button>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <User className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center">
           <div className="w-24 h-24 rounded-[2rem] bg-linear-to-tr from-brand-accent to-purple-500 p-1 mb-6 shadow-xl shadow-brand-accent/20">
             <div className="w-full h-full rounded-[1.8rem] bg-white dark:bg-[#1A1A1A] flex items-center justify-center overflow-hidden">
                <span className="text-3xl font-bold bg-linear-to-tr from-brand-accent to-purple-500 bg-clip-text text-transparent">
                  {userProfile.name.split(' ').map(n => n[0]).join('')}
                </span>
             </div>
           </div>
           
           {isEditing ? (
             <div className="space-y-4 w-full max-w-xs bg-gray-100 dark:bg-white/5 p-6 rounded-[2rem]">
               <div className="space-y-1 text-left">
                 <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-2">Full Name</label>
                 <input 
                   value={editName}
                   onChange={e => setEditName(e.target.value)}
                   placeholder="Your Name"
                   className="w-full bg-white dark:bg-black/20 rounded-xl px-4 py-2 font-bold dark:text-white focus:outline-none border border-gray-200 dark:border-white/10"
                 />
               </div>
               <div className="space-y-1 text-left">
                 <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-2">Email</label>
                 <input 
                   value={editEmail}
                   onChange={e => setEditEmail(e.target.value)}
                   placeholder="Email Address"
                   className="w-full bg-white dark:bg-black/20 rounded-xl px-4 py-2 text-xs dark:text-white focus:outline-none border border-gray-200 dark:border-white/10"
                 />
               </div>
               <div className="space-y-1 text-left">
                 <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-2">Daily Mantra</label>
                 <textarea 
                   value={editBio}
                   onChange={e => setEditBio(e.target.value)}
                   placeholder="Short Bio..."
                   rows={2}
                   className="w-full bg-white dark:bg-black/20 rounded-xl px-4 py-2 text-xs dark:text-white focus:outline-none resize-none border border-gray-200 dark:border-white/10"
                 />
               </div>
               <button 
                 onClick={handleSaveProfile}
                 className="w-full bg-brand-accent text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-brand-accent/20 active:scale-95 transition-all"
               >
                 Update Profile
               </button>
             </div>
           ) : (
             <>
               <h2 className="text-2xl font-bold dark:text-white mb-1">{userProfile.name}</h2>
               <p className="text-xs text-gray-400 font-medium mb-4">{userProfile.email}</p>
               <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs leading-relaxed italic">
                 "{userProfile.bio}"
               </p>
               {userProfile.streak >= 30 && (
                 <div className="mt-4 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center gap-2">
                   <Award className="w-3 h-3 text-brand-accent" />
                   <span className="text-[9px] font-bold text-brand-accent uppercase tracking-widest">30-Day Legend Badge</span>
                 </div>
               )}
             </>
           )}
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-3 gap-4">
        {[
          { label: 'Completed', value: completedTasksCount, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Points', value: completedTasksCount * 15 + events.length * 20, icon: Zap, color: 'text-yellow-500' },
          { label: 'Streak', value: `${userProfile.streak}d`, icon: Activity, color: 'text-brand-accent' }
        ].map((stat, i) => (
          <div key={i} className="glass rounded-[2rem] p-4 flex flex-col items-center justify-center text-center">
            <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
            <p className="text-lg font-bold dark:text-white tabular-nums">{stat.value}</p>
            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Achievements */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2 flex items-center gap-2">
          <Award className="w-4 h-4" />
          Milestones
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
          {[
            { id: 1, title: 'Early Bird', desc: 'Sync before 8AM', icon: '🌅', unlocked: completedTasksCount > 0 },
            { id: 2, title: 'Deep Work', desc: 'Focus Session', icon: '🧠', unlocked: focusSettings.duration >= 25 },
            { id: 5, title: '30-Day Legend', desc: '30 Day Streak', icon: '🔥', unlocked: userProfile.streak >= 30 },
            { id: 3, title: 'Planner', desc: '5 Events Created', icon: '📅', unlocked: events.length >= 5 },
            { id: 4, title: 'Clean Slate', desc: 'Zero Inbox', icon: '✨', unlocked: tasks.length > 0 && tasks.every(t => t.completed) }
          ].map(badge => (
            <div key={badge.id} className={`achievement-glow shrink-0 w-32 glass rounded-[2rem] p-5 text-center flex flex-col items-center border border-transparent transition-all ${badge.unlocked ? 'border-brand-accent/40 opacity-100 shadow-xl shadow-brand-accent/10' : 'opacity-30'}`}>
              <span className="text-2xl mb-2">{badge.icon}</span>
              <h4 className="text-[10px] font-bold dark:text-white leading-tight">{badge.title}</h4>
              <p className="text-[8px] text-gray-500 mt-1">{badge.desc}</p>
              {badge.unlocked && <div className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />}
            </div>
          ))}
        </div>
      </section>

      {/* Integrated Settings */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Preferences</h3>
        
        <div className="space-y-4">
          <div className="glass rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-accent" />
              </div>
              <div>
                <p className="font-bold text-sm dark:text-white">Workspace Theme</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Color Palette</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setTheme('blue')}
                className={`flex-1 h-10 rounded-xl flex items-center justify-center transition-all bg-blue-500 text-white ${theme === 'blue' ? 'border-4 border-white dark:border-gray-800 shadow-md ring-2 ring-blue-500' : 'border-2 border-transparent hover:scale-105'}`}
              >
                {theme === 'blue' && <CheckCircle2 className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setTheme('rose')}
                className={`flex-1 h-10 rounded-xl flex items-center justify-center transition-all bg-rose-500 text-white ${theme === 'rose' ? 'border-4 border-white dark:border-gray-800 shadow-md ring-2 ring-rose-500' : 'border-2 border-transparent hover:scale-105'}`}
              >
                {theme === 'rose' && <CheckCircle2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="glass rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-bold text-sm dark:text-white">Workspace Session</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Focus Mode</p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-[2rem] flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Default Duration</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    value={focusSettings.duration}
                    onChange={(e) => setFocusSettings({ duration: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-16 bg-transparent text-2xl font-bold dark:text-white focus:outline-none"
                  />
                  <span className="text-sm font-bold text-gray-400 mt-1">Minutes</span>
                </div>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-white/10" />
              <button 
                onClick={() => setFocusSettings({ duration: 25 })}
                className="text-[10px] font-bold text-brand-accent uppercase tracking-widest hover:underline"
              >
                Reset Default
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* App Installation Guide */}
      <section className="glass rounded-[2rem] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="font-bold text-sm dark:text-white">Share & Install</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Standalone App</p>
            </div>
          </div>
          <button 
            onClick={() => {
              const url = 'https://ais-pre-xbo6a5fb5ujr5pz6kjntfk-829312217088.asia-southeast1.run.app';
              navigator.clipboard.writeText(url);
              alert('Public App Link copied to clipboard!');
            }}
            className="px-4 py-2 bg-brand-accent/10 text-brand-accent rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent/20 transition-all border border-brand-accent/20"
          >
            Copy Link
          </button>
        </div>
        <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-[3rem] space-y-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Share the link above to give others access to your workspace. They will only see the app, not the editor.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
               <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[8px]">1</div>
               <span>Safari (iOS): Tap Share → Add to Home Screen</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
               <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[8px]">2</div>
               <span>Chrome (Android): Tap Menu → Install App</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-6 opacity-30">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] dark:text-white">Workspace Protocol v1.4</p>
      </footer>
    </motion.div>
  );
}

