import React, { useState } from 'react';
import { Expense } from '../types';
import { DollarSign, Plus, Trash2, CheckCircle, Clock, PieChart } from 'lucide-react';

interface BudgetManagerProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (expenseId: string) => void;
  onTogglePaid: (expenseId: string) => void;
}

export default function BudgetManager({
  expenses,
  onAddExpense,
  onDeleteExpense,
  onTogglePaid
}: BudgetManagerProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Venue');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Fixed wedding budget limit
  const totalBudgetLimit = 35000;

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const paidSpent = expenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
  const unpaidSpent = expenses.filter(e => !e.paid).reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = Math.max(0, totalBudgetLimit - totalSpent);

  const percentSpent = Math.min(100, Math.round((totalSpent / totalBudgetLimit) * 100));

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    onAddExpense({
      description: description.trim(),
      category,
      amount: parseFloat(amount),
      paid: false,
      dueDate: dueDate || undefined
    });

    setDescription('');
    setAmount('');
    setDueDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-slate-500" />
          Budget Expenses & Financial Tracker
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review overall planning cost allocations, mark balances as paid, and monitor remaining limits.
        </p>
      </div>

      {/* Financial Bento Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Allocation Limit</span>
          <span className="font-display text-lg md:text-xl font-bold text-slate-900 mt-1 block">
            ${totalBudgetLimit.toLocaleString()}
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Projected Spent</span>
          <span className="font-display text-lg md:text-xl font-bold text-slate-900 mt-1 block">
            ${totalSpent.toLocaleString()}
          </span>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-wider block">Completed Payments</span>
          <span className="font-display text-lg md:text-xl font-bold text-emerald-800 mt-1 block">
            ${paidSpent.toLocaleString()}
          </span>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono text-amber-600 uppercase tracking-wider block">Remaining Balance</span>
          <span className="font-display text-lg md:text-xl font-bold text-amber-800 mt-1 block">
            ${remainingBudget.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Budget Progress Meter */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-500">Budget Consumed Rate</span>
          <span className="font-bold text-slate-900">{percentSpent}% spent ({totalSpent.toLocaleString()} / {totalBudgetLimit.toLocaleString()})</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${
              percentSpent > 90 ? 'bg-red-500' : percentSpent > 75 ? 'bg-amber-500' : 'bg-slate-800'
            }`}
            style={{ width: `${percentSpent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Expenses List */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            Expenses Register
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 font-medium">Expense description</th>
                  <th className="py-2.5 font-medium">Category</th>
                  <th className="py-2.5 font-medium text-right">Amount</th>
                  <th className="py-2.5 font-medium text-center">Status</th>
                  <th className="py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No expense records found. Use the panel on the right to register your first budget item.
                    </td>
                  </tr>
                ) : (
                  expenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-slate-50/50 group">
                      <td className="py-3 font-medium text-slate-800">
                        {expense.description}
                        {expense.dueDate && (
                          <span className="block text-[10px] font-mono text-slate-400 mt-0.5">Due: {expense.dueDate}</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="bg-slate-100 text-slate-600 font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-medium text-right text-slate-900">
                        ${expense.amount.toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => onTogglePaid(expense.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border cursor-pointer ${
                            expense.paid
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-amber-50 border-amber-100 text-amber-700'
                          }`}
                        >
                          {expense.paid ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              Paid
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-500" />
                              Pending
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onDeleteExpense(expense.id)}
                          className="p-1 hover:bg-red-50 hover:text-red-500 text-slate-300 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Expense Form Sidebar */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
          <h3 className="font-display font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-500" />
            Add Expense
          </h3>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Expense Title</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. DJ Deposit Payment"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                >
                  <option value="Venue">Venue</option>
                  <option value="Decor">Decor</option>
                  <option value="Catering">Catering</option>
                  <option value="Media">Media</option>
                  <option value="Attire">Attire</option>
                  <option value="Music">Music</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Amount ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 rounded-lg transition-colors"
            >
              Log Expense
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
