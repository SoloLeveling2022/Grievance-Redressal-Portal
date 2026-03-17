"use client";
import { CitizenLayout } from "@/components/patient/patient-layout";
import React, { useEffect, useState } from "react";

interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

const LOCAL_STORAGE_KEY = "citizen_health_goals";

function loadGoals(): Goal[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveGoals(goals: Goal[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(goals));
  }
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setGoals(loadGoals());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveGoals(goals);
    }
  }, [goals, loaded]);

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    setGoals([
      ...goals,
      { id: Date.now().toString(), text: newGoal.trim(), completed: false },
    ]);
    setNewGoal("");
  };

  const toggleGoal = (id: string) => {
    setGoals(goals =>
      goals.map(goal =>
        goal.id === id ? { ...goal, completed: !goal.completed } : goal
      )
    );
  };

  const deleteGoal = (id: string) => {
    setGoals(goals => goals.filter(goal => goal.id !== id));
  };

  return (
    <CitizenLayout>
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Personal Health Goals</h1>
      <form onSubmit={addGoal} className="flex gap-2 mb-6">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
          placeholder="Add a new goal..."
          value={newGoal}
          onChange={e => setNewGoal(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add
        </button>
      </form>
      <ul className="space-y-3">
        {goals.length === 0 && (
          <li className="text-gray-500 text-center">No goals yet. Add one above!</li>
        )}
        {goals.map(goal => (
          <li
            key={goal.id}
            className={`flex items-center justify-between p-3 rounded border ${goal.completed ? "bg-green-50 border-green-300" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={goal.completed}
                onChange={() => toggleGoal(goal.id)}
                className="h-5 w-5 text-green-600"
              />
              <span className={goal.completed ? "line-through text-gray-400" : ""}>{goal.text}</span>
            </div>
            <button
              onClick={() => deleteGoal(goal.id)}
              className="text-red-500 hover:text-red-700 px-2"
              title="Delete goal"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
    </CitizenLayout>
  );
}
