export type TimerMode = "focus" | "shortBreak" | "longBreak";
export type SessionStatus = "completed" | "interrupted";

export type Subject = {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
};
export type StudySession = {
  id: string;
  subjectId: string | null;
  subjectName: string;
  startedAt: string;
  endedAt: string;
  plannedSeconds: number;
  actualSeconds: number;
  status: SessionStatus;
};

export type Settings = {
  theme: "light" | "dark" | "system";
  accent: string;
  sound: boolean;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesUntilLongBreak: number;
  autoStart: boolean;
};

export type PersistedTimer = {
  mode: TimerMode;
  subjectId: string | null;
  subjectName: string | null;
  remainingSeconds: number;
  plannedSeconds: number;
  isRunning: boolean;
  endTime: number | null;
  elapsedFocusSeconds: number;
  sessionStartedAt: string | null;
  completedFocusesInCycle: number;
};

export const STORAGE_KEYS = {
  settings: "karol-pomodoro:settings:v1",
  subjects: "karol-pomodoro:subjects:v1",
  sessions: "karol-pomodoro:sessions:v1",
  timer: "karol-pomodoro:timer:v1",
} as const;
export const MIN_SESSION_SECONDS = 60;
const subjectNames = [
  "Matemática",
  "Português",
  "Redação",
  "Física",
  "Química",
  "Biologia",
  "História",
  "Geografia",
  "Filosofia",
  "Sociologia",
  "Inglês",
  "Literatura",
];
const colors = [
  "#7c6ee6",
  "#e0709b",
  "#5aaa8d",
  "#d79357",
  "#6389d9",
  "#55a77e",
  "#bf7c55",
  "#6e9b9a",
  "#9c79c6",
  "#c47b9d",
  "#577faf",
  "#ad8a62",
];
export const DEFAULT_SUBJECTS: Subject[] = subjectNames.map((name, index) => ({
  id: `default-${index + 1}`,
  name,
  color: colors[index],
  isDefault: true,
}));
export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  accent: "#7c6ee6",
  sound: true,
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesUntilLongBreak: 4,
  autoStart: false,
};
export const defaultTimer = (settings: Settings): PersistedTimer => ({
  mode: "focus",
  subjectId: DEFAULT_SUBJECTS[0].id,
  subjectName: DEFAULT_SUBJECTS[0].name,
  remainingSeconds: settings.focusMinutes * 60,
  plannedSeconds: settings.focusMinutes * 60,
  isRunning: false,
  endTime: null,
  elapsedFocusSeconds: 0,
  sessionStartedAt: null,
  completedFocusesInCycle: 0,
});
export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
export function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
export function normalizeName(name: string) {
  return name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
export function getAccentForeground(color: string) {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const [red, green, blue] = [0, 2, 4].map((index) =>
    Number.parseInt(hex.slice(index, index + 2), 16),
  );
  return red * 0.299 + green * 0.587 + blue * 0.114 > 165
    ? "#302a3a"
    : "#ffffff";
}
export function formatDuration(seconds: number) {
  const mins = Math.max(0, Math.round(seconds / 60));
  const h = Math.floor(mins / 60);
  return h
    ? `${h}h ${mins % 60 ? `${mins % 60}min` : ""}`.trim()
    : `${mins} min`;
}
export function formatClock(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
export function localDay(date: string | Date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
export function getTotalStudyTime(sessions: StudySession[]) {
  return sessions.reduce((sum, item) => sum + item.actualSeconds, 0);
}
export function getTodaySessions(sessions: StudySession[]) {
  const today = localDay(new Date());
  return sessions.filter((session) => localDay(session.endedAt) === today);
}
export function startOfWeek() {
  const d = new Date();
  const day = d.getDay() || 7;
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() - day + 1,
  ).getTime();
}
export function getWeekSessions(sessions: StudySession[]) {
  const start = startOfWeek();
  const end = start + 7 * 86400000;
  return sessions.filter((session) => {
    const day = localDay(session.endedAt);
    return day >= start && day < end;
  });
}
export function getStudyTimeBySubject(sessions: StudySession[]) {
  return Object.entries(
    sessions.reduce<Record<string, number>>((totals, session) => {
      totals[session.subjectName] =
        (totals[session.subjectName] || 0) + session.actualSeconds;
      return totals;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
}
export function weeklyDays(sessions: StudySession[]) {
  const start = startOfWeek();
  return Array.from({ length: 7 }, (_, index) => {
    const day = start + index * 86400000;
    return {
      label: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][index],
      seconds: getTotalStudyTime(
        sessions.filter((session) => localDay(session.endedAt) === day),
      ),
    };
  });
}
