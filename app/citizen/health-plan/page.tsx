"use client";
import { useState, useEffect, useRef } from "react";
import { CitizenLayout } from "@/components/patient/patient-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";

const activityLevels = ["Low", "Moderate", "High"];
const dietaryPreferences = ["Keto", "Vegetarian", "Low Carb", "Balanced"];
const fitnessGoals = ["Weight Loss", "Muscle Gain", "Endurance", "Flexibility", "General Health"];
const genders = ["Male", "Female", "Other"];

// Color map for each page
const pageColors = [
  "bg-blue-50 border-blue-200 text-blue-900",
  "bg-green-50 border-green-200 text-green-900",
  "bg-yellow-50 border-yellow-200 text-yellow-900",
  "bg-gray-50 border-gray-200 text-gray-900",
];

function splitMarkdownSections(markdown: string): { title: string; content: string }[] {
  // Split by top-level headings (## or ###)
  const sectionRegex = /^(#+)\s+(.+)$/gm;
  const matches = [...markdown.matchAll(sectionRegex)];
  if (!matches.length) return [{ title: "Plan", content: `\n\n${markdown}\n\n` }];
  const sections: { title: string; content: string }[] = [];
  let lastIndex = 0;
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const start = match.index!;
    const end = matches[i + 1]?.index ?? markdown.length;
    const title = match[2].trim();
    // Add extra line breaks before and after each section
    const content = `\n\n${markdown.slice(start, end).trim()}\n\n`;
    sections.push({ title, content });
    lastIndex = end;
  }
  return sections;
}

function groupSectionsForPages(sections: { title: string; content: string }[]): { title: string; content: string }[] {
  // If there are 5 sections, group last two into one page
  if (sections.length === 5) {
    return [
      sections[0],
      sections[1],
      sections[2],
      {
        title: `${sections[3].title} & ${sections[4].title}`,
        content: `${sections[3].content}\n\n${sections[4].content}`,
      },
    ];
  }
  // Fallback: just return as-is
  return sections;
}

export default function HealthPlanPage() {
  const [form, setForm] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    gender: "",
    activity_level: "",
    dietary_preference: "",
    fitness_goal: "",
    medical_conditions: "",
    allergies: "",
    medications: "",
  });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const responseRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedForm = localStorage.getItem("healthPlanForm");
      const savedPlan = localStorage.getItem("healthPlanResponse");
      if (savedForm) setForm(JSON.parse(savedForm));
      if (savedPlan) setPlan(savedPlan);
    }
  }, []);

  // Save to localStorage when form or plan changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("healthPlanForm", JSON.stringify(form));
      if (plan) localStorage.setItem("healthPlanResponse", plan);
    }
  }, [form, plan]);

  useEffect(() => {
    setPage(0); // Reset to first page when plan changes
  }, [plan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/citizen/health-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          age: form.age,
          weight: form.weight,
          height: form.height,
          gender: form.gender,
          activity_level: form.activity_level,
          dietary_preference: form.dietary_preference,
          fitness_goal: form.fitness_goal,
          medical_conditions: form.medical_conditions.split(",").map(s => s.trim()).filter(Boolean),
          allergies: form.allergies.split(",").map(s => s.trim()).filter(Boolean),
          medications: form.medications.split(",").map(s => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlan(data.plan);
        if (typeof window !== "undefined") {
          localStorage.setItem("healthPlanForm", JSON.stringify(form));
          localStorage.setItem("healthPlanResponse", data.plan);
        }
      } else {
        setError(data.error || "Failed to generate plan.");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // New Plan handler
  const handleNewPlan = () => {
    const emptyForm = {
      name: "",
      age: "",
      weight: "",
      height: "",
      gender: "",
      activity_level: "",
      dietary_preference: "",
      fitness_goal: "",
      medical_conditions: "",
      allergies: "",
      medications: "",
    };
    setForm(emptyForm);
    setPlan(null);
    setError(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("healthPlanForm");
      localStorage.removeItem("healthPlanResponse");
    }
  };

  // Pagination logic
  const rawSections = plan ? splitMarkdownSections(plan) : [];
  const sections = groupSectionsForPages(rawSections);
  const totalPages = sections.length;
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  // Animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      position: "absolute" as const,
    }),
    center: { x: 0, opacity: 1, position: "relative" as const },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      position: "absolute" as const,
    }),
  };
  const [direction, setDirection] = useState(0);
  const handlePaginate = (newPage: number) => {
    setDirection(newPage > page ? 1 : -1);
    setPage(newPage);
  };

  return (
    <CitizenLayout>
      <div className="max-w-full mx-auto py-8">
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={handleNewPlan} type="button">
            New Plan
          </Button>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 min-w-[320px]">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Personalized Health & Fitness Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
                    <Input name="age" type="number" placeholder="Age" value={form.age} onChange={handleChange} required />
                    <Input name="weight" type="number" placeholder="Weight (kg)" value={form.weight} onChange={handleChange} required />
                    <Input name="height" type="number" placeholder="Height (ft)" value={form.height} onChange={handleChange} required />
                    <Select value={form.gender} onValueChange={v => handleSelect("gender", v)}>
                      <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                      <SelectContent>
                        {genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={form.activity_level} onValueChange={v => handleSelect("activity_level", v)}>
                      <SelectTrigger><SelectValue placeholder="Activity Level" /></SelectTrigger>
                      <SelectContent>
                        {activityLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={form.dietary_preference} onValueChange={v => handleSelect("dietary_preference", v)}>
                      <SelectTrigger><SelectValue placeholder="Dietary Preference" /></SelectTrigger>
                      <SelectContent>
                        {dietaryPreferences.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={form.fitness_goal} onValueChange={v => handleSelect("fitness_goal", v)}>
                      <SelectTrigger><SelectValue placeholder="Fitness Goal" /></SelectTrigger>
                      <SelectContent>
                        {fitnessGoals.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea name="medical_conditions" placeholder="Medical Conditions (comma separated)" value={form.medical_conditions} onChange={handleChange} />
                  <Textarea name="allergies" placeholder="Allergies (comma separated)" value={form.allergies} onChange={handleChange} />
                  <Textarea name="medications" placeholder="Medications (comma separated)" value={form.medications} onChange={handleChange} />
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Generating..." : "Generate Plan"}</Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="flex-1 min-w-[320px] flex flex-col">
            {plan && (
              <Card className={`relative flex-1 border-2 shadow-lg ${pageColors[page]} flex flex-col min-h-[500px]`}>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-center">{sections[page]?.title || "Plan"}</CardTitle>
                </CardHeader>
                <CardContent ref={responseRef} className="flex-1 flex flex-col">
                  <div className="relative min-h-[200px] flex-1">
                    <AnimatePresence initial={false} custom={direction}>
                      <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.4, type: "spring" }}
                        className="absolute w-full h-full"
                      >
                        <div className="prose prose-lg max-w-none mb-8">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({node, ...props}) => (
                                <table className="min-w-full border border-gray-300 rounded overflow-hidden my-4">{props.children}</table>
                              ),
                              th: ({node, ...props}) => (
                                <th className="bg-gray-100 border px-3 py-2 text-left">{props.children}</th>
                              ),
                              td: ({node, ...props}) => (
                                <td className="border px-3 py-2">{props.children}</td>
                              ),
                            }}
                          >
                            {sections[page]?.content || ""}
                          </ReactMarkdown>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  {/* Pagination Controls - always at the bottom of the card */}
                  <div className="w-full flex justify-between items-center mb-0 bg-white rounded-lg p-2 shadow sticky bottom-0 left-0 right-0 z-20">
                    <Button
                      variant="secondary"
                      onClick={() => handlePaginate(page - 1)}
                      disabled={!canPrev}
                      className="transition-all duration-200 font-bold px-4 py-2 rounded-full"
                    >
                      ← Prev
                    </Button>
                    <span className="font-semibold">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      onClick={() => handlePaginate(page + 1)}
                      disabled={!canNext}
                      className="transition-all duration-200 font-bold px-4 py-2 rounded-full"
                    >
                      Next →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {error && (
              <div className="text-red-600 text-center font-semibold mt-4">{error}</div>
            )}
          </div>
        </div>
      </div>
    </CitizenLayout>
  );
}
