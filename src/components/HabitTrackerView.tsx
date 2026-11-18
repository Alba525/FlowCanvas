import React, { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { HabitItem } from '../types/workspace';

interface HabitTrackerViewProps {
  habits: HabitItem[];
  onChange: (habits: HabitItem[]) => void;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HabitTrackerView: React.FC<HabitTrackerViewProps> = ({ habits, onChange }) => {
  const [newHabitName, setNewHabitName] = useState('');

  const toggleDay = (habitId: string, dayIdx: number) => {
    onChange(
      habits.map((h) =>
        h.id === habitId
          ? { ...h, days: h.days.map((val, idx) => (idx === dayIdx ? !val : val)) }
          : h
      )
    );
  };

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newHabitName.trim();
    if (!trimmed) return;
    onChange([
      ...habits,
      {
        id: `hab-${Date.now()}`,
        name: trimmed,
        days: [false, false, false, false, false, false, false],
      },
    ]);
    setNewHabitName('');
  };

  const deleteHabit = (id: string) => {
    onChange(habits.filter((h) => h.id !== id));
  };

  return (
    <div className="mb-8">
      <div className="border border-[#EAE9E5] rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-[minmax(180px,1.5fr)_repeat(7,minmax(36px,1fr))_72px] items-center px-4 py-2.5 bg-[#F7F7F5] border-b border-[#EAE9E5] text-[12px] font-medium text-[#787774]">
          <span>Habit</span>
          {WEEK_DAYS.map((day) => (
            <span key={day} className="text-center">
              {day}
            </span>
          ))}
          <span className="text-right">Weekly</span>
        </div>

        <div className="divide-y divide-[#F1F1EF]">
          {habits.map((habit) => {
            const doneCount = habit.days.filter(Boolean).length;
            const pct = Math.round((doneCount / 7) * 100);
            return (
              <div
                key={habit.id}
                className="group grid grid-cols-[minmax(180px,1.5fr)_repeat(7,minmax(36px,1fr))_72px] items-center px-4 py-2.5 hover:bg-[#F7F7F5]/60 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="text-[14px] text-[#37352F] truncate">{habit.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${habit.name}`}
                    onClick={() => deleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#9B9A97] hover:text-[#C43E3E] transition-opacity shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {habit.days.map((checked, idx) => (
                  <div key={idx} className="flex justify-center">
                    <button
                      type="button"
                      aria-label={`${habit.name} on ${WEEK_DAYS[idx]}`}
                      onClick={() => toggleDay(habit.id, idx)}
                      className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition-colors ${
                        checked
                          ? 'bg-[#357A57] border border-[#357A57] text-white'
                          : 'bg-white border border-[#D4D3CE] hover:border-[#787774]'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                  </div>
                ))}

                <div className="text-right text-[12.5px] font-mono text-[#787774] tabular-nums">
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={addHabit}
          className="px-4 py-2 border-t border-[#F1F1EF] flex items-center gap-2 bg-white"
        >
          <Plus className="w-3.5 h-3.5 text-[#9B9A97]" />
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="Add a new daily habit and press Enter..."
            className="flex-1 text-[13.5px] bg-transparent outline-none text-[#37352F] placeholder:text-[#9B9A97]"
          />
        </form>
      </div>
    </div>
  );
};
