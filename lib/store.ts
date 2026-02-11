'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'child';
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface Task {
  _id: string;
  title: string;
  description: string;
  points: number;
  status: 'active' | 'completed' | 'archived';
  parent: string;
  child: string;
  dueDate?: Date;
}

interface TaskStore {
  tasks: Task[];
  filteredTasks: Task[];
  setTasks: (tasks: Task[]) => void;
  setFilteredTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Task) => void;
  deleteTask: (id: string) => void;
}

export const useTaskStore = create<TaskStore>()((set) => ({
  tasks: [],
  filteredTasks: [],
  setTasks: (tasks) => set({ tasks }),
  setFilteredTasks: (tasks) => set({ filteredTasks: tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, task) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === id ? task : t)),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t._id !== id),
    })),
}));

interface Reward {
  _id: string;
  title: string;
  description: string;
  pointsCost: number;
  parent: string;
  imageUrl?: string;
  status: 'active' | 'inactive';
}

interface RewardStore {
  rewards: Reward[];
  setRewards: (rewards: Reward[]) => void;
  addReward: (reward: Reward) => void;
  updateReward: (id: string, reward: Reward) => void;
  deleteReward: (id: string) => void;
}

export const useRewardStore = create<RewardStore>()((set) => ({
  rewards: [],
  setRewards: (rewards) => set({ rewards }),
  addReward: (reward) => set((state) => ({ rewards: [...state.rewards, reward] })),
  updateReward: (id, reward) =>
    set((state) => ({
      rewards: state.rewards.map((r) => (r._id === id ? reward : r)),
    })),
  deleteReward: (id) =>
    set((state) => ({
      rewards: state.rewards.filter((r) => r._id !== id),
    })),
}));
