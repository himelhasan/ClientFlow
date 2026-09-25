"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckSquare,
  Plus,
  LayoutGrid,
  List as ListIcon,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  Calendar,
  Trash2,
  Loader2,
  Filter,
  X,
  Phone,
} from "lucide-react";
import { formatBdDate } from "@/lib/utils/bangladesh";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffOption {
  id: string;
  name: string;
  role?: string | null;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  dueDate: string | null;
  assignedStaffId: string | null;
  assignedStaff?: StaffOption | null;
  customerId: string | null;
  customer?: CustomerOption | null;
  bookingId?: string | null;
  booking?: { id: string; bookingNumber: string; status: string } | null;
  completedAt: string | null;
  createdAt: string;
}

const COLUMNS: Array<{
  key: TaskItem["status"];
  label: string;
  badgeCls: string;
}> = [
  {
    key: "TODO",
    label: "To Do / Pending",
    badgeCls: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  },
  {
    key: "IN_PROGRESS",
    label: "In Progress",
    badgeCls: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  },
  {
    key: "COMPLETED",
    label: "Completed",
    badgeCls: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  },
  {
    key: "CANCELLED",
    label: "Cancelled",
    badgeCls: "bg-[#F8F8FA] text-[#73767D] border border-[#EAEAEA]",
  },
];

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
  HIGH: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  MEDIUM: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  LOW: "bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]",
};

export default function TasksDashboardPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"BOARD" | "LIST">("BOARD");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [staffFilter, setStaffFilter] = useState<string>("ALL");

  const [showNewModal, setShowNewModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "HIGH",
    status: "TODO",
    dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
    assignedStaffId: "",
    customerId: "",
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
      setStaffList(data.staff || []);
      setCustomersList(data.customers || []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function isOverdue(task: TaskItem): boolean {
    if (task.status === "COMPLETED" || task.status === "CANCELLED")
      return false;
    if (!task.dueDate) return false;
    return new Date(task.dueDate).getTime() < Date.now();
  }

  async function handleStatusChange(
    taskId: string,
    nextStatus: TaskItem["status"]
  ) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: nextStatus,
              completedAt:
                nextStatus === "COMPLETED" ? new Date().toISOString() : null,
            }
          : t
      )
    );

    try {
      await fetch("/api/v1/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: nextStatus }),
      });
    } catch (err) {
      console.error("Failed to update task status", err);
    }
  }

  async function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/v1/tasks?id=${encodeURIComponent(taskId)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setTasks((prev) => [data.task, ...prev]);
        setShowNewModal(false);
        setNewTask({
          title: "",
          description: "",
          priority: "HIGH",
          status: "TODO",
          dueDate: new Date(Date.now() + 24 * 3600 * 1000)
            .toISOString()
            .slice(0, 16),
          assignedStaffId: "",
          customerId: "",
        });
      }
    } finally {
      setCreating(false);
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    if (staffFilter !== "ALL" && t.assignedStaffId !== staffFilter)
      return false;
    return true;
  });

  const overdueCount = tasks.filter((t) => isOverdue(t)).length;
  const openCount = tasks.filter(
    (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
  ).length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="space-y-6 bg-[#F8F8F6] text-[#181A1E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F5C94A] text-[#181A1E] flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
              Tasks & Follow-Ups
            </h1>
            <p className="text-xs text-[#73767D]">
              Track staff follow-ups, deposit reminders, and lead callbacks
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Board / List Toggle */}
          <div className="inline-flex bg-[#F3F1E8] p-1 rounded-xl border border-[#EAEAEA]">
            <button
              type="button"
              onClick={() => setViewMode("BOARD")}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition ${
                viewMode === "BOARD"
                  ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                  : "text-[#262930] hover:text-[#181A1E] font-medium"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition ${
                viewMode === "LIST"
                  ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                  : "text-[#262930] hover:text-[#181A1E] font-medium"
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Follow-up Task
          </button>
        </div>
      </div>

      {/* KPI Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-[#73767D] uppercase tracking-wider">
              Overdue Follow-ups
            </p>
            <p className="text-2xl font-black text-[#9E2A2B] mt-1">
              {overdueCount}
            </p>
            <p className="text-[11px] text-[#73767D]">
              Requires immediate staff callback
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAD4D6] border border-[#F5BFC2] flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-[#9E2A2B]" />
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-[#73767D] uppercase tracking-wider">
              Active / Open Tasks
            </p>
            <p className="text-2xl font-black text-[#181A1E] mt-1">
              {openCount}
            </p>
            <p className="text-[11px] text-[#73767D]">
              In queue across team members
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FBF3DC] border border-[#F2E2B6] flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#5B4712]" />
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-[#73767D] uppercase tracking-wider">
              Completed Follow-ups
            </p>
            <p className="text-2xl font-black text-[#184E37] mt-1">
              {completedCount}
            </p>
            <p className="text-[11px] text-[#73767D]">
              Closed customer interactions
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E3F5EC] border border-[#CBEAD9] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#184E37]" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#73767D] flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Priority:
          </span>
          {["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"].map((prio) => (
            <button
              key={prio}
              type="button"
              onClick={() => setPriorityFilter(prio)}
              className={`px-3 py-1.5 rounded-xl text-xs transition ${
                priorityFilter === prio
                  ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                  : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium"
              }`}
            >
              {prio}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#73767D]">Assignee:</span>
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] font-medium focus:border-[#F5C94A] focus:outline-none"
          >
            <option value="ALL">All Staff Members</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#181A1E]" />
        </div>
      ) : viewMode === "BOARD" ? (
        /* ─── KANBAN BOARD VIEW ───────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                className="bg-[#F8F8FA] rounded-[20px] border border-[#EAEAEA] p-4 flex flex-col space-y-3 min-h-[420px]"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${col.badgeCls}`}
                  >
                    {col.label}
                  </span>
                  <span className="text-xs font-extrabold text-[#181A1E] bg-white px-2 py-0.5 rounded-lg border border-[#EAEAEA]">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="h-32 rounded-xl border border-dashed border-[#EAEAEA] flex items-center justify-center text-xs text-[#73767D]">
                      No tasks in {col.label}
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const overdue = isOverdue(task);
                      return (
                        <div
                          key={task.id}
                          className="bg-white rounded-[14px] border border-[#EAEAEA] p-4 space-y-3 hover:border-[#F5C94A] transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                PRIORITY_BADGE[task.priority] ||
                                PRIORITY_BADGE.MEDIUM
                              }`}
                            >
                              {task.priority}
                            </span>
                            {overdue && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]">
                                OVERDUE
                              </span>
                            )}
                          </div>

                          <div>
                            <p
                              className={`text-xs font-bold text-[#181A1E] leading-snug ${
                                task.status === "COMPLETED"
                                  ? "line-through text-[#73767D]"
                                  : ""
                              }`}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-[11px] text-[#73767D] mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Linked Customer / Staff */}
                          <div className="space-y-1 pt-1 border-t border-[#F8F8FA] text-[11px] text-[#73767D]">
                            {task.customer && (
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-[#181A1E] flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-[#73767D]" />
                                  {task.customer.name}
                                </span>
                                {task.booking && (
                                  <span className="font-mono text-[10px] bg-[#F3F1E8] text-[#262930] px-1.5 py-0.5 rounded border border-[#EAEAEA]">
                                    {task.booking.bookingNumber}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assignedStaff?.name || "Unassigned"}
                              </span>
                              {task.dueDate && (
                                <span
                                  className={`flex items-center gap-1 ${
                                    overdue ? "text-[#9E2A2B] font-bold" : ""
                                  }`}
                                >
                                  <Calendar className="w-3 h-3" />
                                  {formatBdDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Status Controls */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#EAEAEA]">
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  task.id,
                                  e.target.value as TaskItem["status"]
                                )
                              }
                              className="px-2 py-1 bg-[#F8F8FA] border border-[#EAEAEA] rounded-lg text-[10px] font-bold text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>

                            <div className="flex items-center gap-1">
                              {task.status !== "COMPLETED" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(task.id, "COMPLETED")
                                  }
                                  className="px-2 py-1 bg-[#E3F5EC] hover:bg-[#CBEAD9] text-[#184E37] border border-[#CBEAD9] rounded-lg text-[10px] font-bold transition"
                                >
                                  ✓ Complete
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 text-[#73767D] hover:text-[#9E2A2B] transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── LIST VIEW ──────────────────────────────────────────────────── */
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[#73767D] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Task & Follow-up</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Assigned Staff</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {filteredTasks.map((task) => {
                  const overdue = isOverdue(task);
                  return (
                    <tr key={task.id} className="hover:bg-[#F8F8FA] transition">
                      <td className="py-3.5 px-4">
                        <p
                          className={`font-bold text-[#181A1E] ${
                            task.status === "COMPLETED"
                              ? "line-through text-[#73767D]"
                              : ""
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-[11px] text-[#73767D] mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {task.customer ? (
                          <div>
                            <p className="font-bold text-[#181A1E]">
                              {task.customer.name}
                            </p>
                            <p className="font-mono text-[10px] text-[#73767D]">
                              {task.customer.phone}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[#73767D] italic">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#181A1E]">
                        {task.assignedStaff?.name || "Unassigned"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            PRIORITY_BADGE[task.priority] ||
                            PRIORITY_BADGE.MEDIUM
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {task.dueDate ? (
                          <span
                            className={
                              overdue
                                ? "text-[#9E2A2B] font-semibold"
                                : "text-[#181A1E]"
                            }
                          >
                            {formatBdDate(task.dueDate)}
                            {overdue ? " (Overdue)" : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(
                              task.id,
                              e.target.value as TaskItem["status"]
                            )
                          }
                          className="px-2.5 py-1 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-semibold text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                        >
                          <option value="TODO">TODO</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 rounded-xl hover:bg-[#FAD4D6] text-[#73767D] hover:text-[#9E2A2B] transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── New Follow-up Task Modal ────────────────────────────────────────── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-lg w-full p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#181A1E]">
                  New Follow-up Task
                </h2>
                <p className="text-xs text-[#73767D]">
                  Assign a customer callback, payment check, or appointment
                  follow-up
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-lg text-[#73767D] hover:text-[#181A1E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g. Call customer to confirm bKash deposit"
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Notes / Instructions
                </label>
                <textarea
                  rows={2}
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Context or script for the staff member…"
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask((p) => ({ ...p, priority: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-semibold text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Due Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask((p) => ({ ...p, dueDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Assign to Staff
                  </label>
                  <select
                    value={newTask.assignedStaffId}
                    onChange={(e) =>
                      setNewTask((p) => ({
                        ...p,
                        assignedStaffId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-semibold text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Link Customer
                  </label>
                  <select
                    value={newTask.customerId}
                    onChange={(e) =>
                      setNewTask((p) => ({ ...p, customerId: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-semibold text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  >
                    <option value="">None</option>
                    {customersList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] rounded-xl text-xs font-medium text-[#262930] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Follow-up Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
