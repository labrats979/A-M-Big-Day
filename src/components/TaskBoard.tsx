import React, { useState } from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, Clock, Plus, Trash2, Calendar, ClipboardCheck } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  isAdmin: boolean;
  onAddTask?: (task: Omit<Task, 'id'>) => void;
  onUpdateTaskStatus?: (taskId: string, status: Task['status']) => void;
  onDeleteTask?: (taskId: string) => void;
}

export default function TaskBoard({
  tasks,
  isAdmin,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask
}: TaskBoardProps) {
  const [filterStage, setFilterStage] = useState<Task['stage'] | 'all'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newStage, setNewStage] = useState<Task['stage']>('preparation');
  const [newDueDate, setNewDueDate] = useState('');

  const filteredTasks = tasks.filter(t => filterStage === 'all' || t.stage === filterStage);
  
  const stageStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    todo: tasks.filter(t => t.status === 'todo').length
  };

  const percentCompleted = stageStats.total ? Math.round((stageStats.completed / stageStats.total) * 100) : 0;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !onAddTask) return;

    onAddTask({
      title: newTitle.trim(),
      stage: newStage,
      status: 'todo',
      dueDate: newDueDate || new Date().toISOString().split('T')[0]
    });

    setNewTitle('');
    setNewDueDate('');
  };

  const getStageColor = (stage: Task['stage']) => {
    switch (stage) {
      case 'preparation':
        return {
          bg: 'bg-blue-50 border-blue-100',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-800'
        };
      case 'ceremony':
        return {
          bg: 'bg-emerald-50 border-emerald-100',
          text: 'text-emerald-700',
          badge: 'bg-emerald-100 text-emerald-800'
        };
      case 'reception':
        return {
          bg: 'bg-amber-50 border-amber-100',
          text: 'text-amber-700',
          badge: 'bg-amber-100 text-amber-800'
        };
      case 'post-wedding':
        return {
          bg: 'bg-purple-50 border-purple-100',
          text: 'text-purple-700',
          badge: 'bg-purple-100 text-purple-800'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-slate-500" />
            Color-Coded Planning Tasks
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Keep track of every wedding phase. Milestones are organized by ceremony and reception stages.
          </p>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl self-start md:self-auto min-w-[200px]">
          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-mono mb-1">
              <span className="text-slate-500">Total Progress</span>
              <span className="font-bold text-slate-900">{percentCompleted}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-slate-800 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${percentCompleted}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(['all', 'preparation', 'ceremony', 'reception', 'post-wedding'] as const).map(stage => (
          <button
            key={stage}
            onClick={() => setFilterStage(stage)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
              filterStage === stage
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {stage === 'all' ? 'All Stages' : stage.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Task List Column */}
        <div className="lg:col-span-8 space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white border border-slate-150 rounded-2xl p-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="text-xs font-medium">No tasks found for this stage.</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const colors = getStageColor(task.stage);
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';

              return (
                <div
                  key={task.id}
                  className={`bg-white border border-slate-200/80 rounded-xl p-4 transition-all hover:border-slate-300 flex items-start gap-3 justify-between ${
                    isCompleted ? 'opacity-65' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Status Checkbox Button */}
                    <button
                      onClick={() => {
                        if (onUpdateTaskStatus) {
                          const nextStatus: Task['status'] = 
                            task.status === 'todo' ? 'in_progress' : 
                            task.status === 'in_progress' ? 'completed' : 'todo';
                          onUpdateTaskStatus(task.id, nextStatus);
                        }
                      }}
                      className="mt-0.5 text-slate-400 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-slate-800" />
                      ) : isInProgress ? (
                        <Clock className="w-5 h-5 text-amber-500 animate-spin-slow" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium leading-snug ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.badge}`}>
                          {task.stage.replace('-', ' ')}
                        </span>
                        
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>Due: {task.dueDate}</span>
                        </div>

                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isCompleted ? 'text-slate-400' : isInProgress ? 'text-amber-500' : 'text-blue-500'
                        }`}>
                          • {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete button (Admins only) */}
                  {isAdmin && onDeleteTask && (
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add Task Sidebar Panel (Admins Only) */}
        {isAdmin && onAddTask && (
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Plus className="w-4 h-4 text-slate-500" />
              Add Planning Task
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Task Title</label>
                <textarea
                  required
                  rows={2}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Schedule final tasting with caterer"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Planning Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as Task['stage'])}
                  className="w-full text-xs px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                >
                  <option value="preparation">Preparation</option>
                  <option value="ceremony">Ceremony</option>
                  <option value="reception">Reception</option>
                  <option value="post-wedding">Post-Wedding</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Target Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 rounded-lg transition-colors"
              >
                Create Task
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
