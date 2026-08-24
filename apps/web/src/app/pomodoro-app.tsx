"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Check,
  ChevronDown,
  Clock3,
  Download,
  FileUp,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  SkipForward,
  TimerReset,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_SETTINGS,
  DEFAULT_SUBJECTS,
  defaultTimer,
  formatClock,
  formatDuration,
  getAccentForeground,
  getStudyTimeBySubject,
  getTodaySessions,
  getTotalStudyTime,
  getWeekSessions,
  isLightColor,
  localDay,
  MIN_SESSION_SECONDS,
  makeId,
  normalizeName,
  normalizeSettings,
  type PersistedTimer,
  readStorage,
  type Settings,
  STORAGE_KEYS,
  type StudySession,
  type Subject,
  type TimerMode,
  weeklyDays,
  writeStorage,
} from "@/lib/study";

type View = "focus" | "progress";
type Pending = "end" | "restart" | "skip" | null;
const modeData: { id: TimerMode; label: string }[] = [
  { id: "focus", label: "Foco" },
  { id: "shortBreak", label: "Pausa" },
  { id: "longBreak", label: "Longa" },
];
const phrase = (subject: string) =>
  ({
    Matemática: "Bora de matemática, Karolzinha.",
    Redação: "Agora é só você e a redação.",
    Biologia: "Mais um pouco de biologia e depois descansa.",
  })[subject] ||
  `Um bloco de cada vez, Karolzinha. Hoje é dia de ${subject.toLowerCase()}.`;

export default function PomodoroApp() {
  const [ready, setReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<View>("focus");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [timer, setTimer] = useState<PersistedTimer>(
    defaultTimer(DEFAULT_SETTINGS),
  );
  const timerRef = useRef(timer);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("Todas");
  const [pending, setPending] = useState<Pending>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [showMoreDurations, setShowMoreDurations] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedSettings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      ...readStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
    });
    const storedTimer = readStorage(
      STORAGE_KEYS.timer,
      defaultTimer(storedSettings),
    );
    setSettings(storedSettings);
    setSubjects(readStorage(STORAGE_KEYS.subjects, DEFAULT_SUBJECTS));
    setSessions(readStorage(STORAGE_KEYS.sessions, []));
    setTimer(storedTimer);
    timerRef.current = storedTimer;
    setReady(true);
    const splashTimer = window.setTimeout(() => setShowSplash(false), 850);
    return () => window.clearTimeout(splashTimer);
  }, []);
  useEffect(() => {
    timerRef.current = timer;
    if (ready) writeStorage(STORAGE_KEYS.timer, timer);
  }, [ready, timer]);
  useEffect(() => {
    if (ready) {
      writeStorage(STORAGE_KEYS.settings, settings);
      document.documentElement.dataset.theme = settings.theme;
      document.documentElement.style.setProperty("--accent", settings.accent);
      const accentForeground = getAccentForeground(settings.accent);
      document.documentElement.style.setProperty(
        "--accent-foreground",
        accentForeground,
      );
      document.documentElement.style.setProperty(
        "--primary-foreground",
        accentForeground,
      );
      if (settings.backgroundColor) {
        const lightBackground = isLightColor(settings.backgroundColor);
        const tokens = lightBackground
          ? {
              "--foreground": "#302a3a",
              "--card": "#ffffff",
              "--card-foreground": "#302a3a",
              "--popover": "#ffffff",
              "--popover-foreground": "#302a3a",
              "--secondary": "#f2eef7",
              "--secondary-foreground": "#41394e",
              "--muted": "#f4f0f6",
              "--muted-foreground": "#756d7f",
              "--border": "#e8e2eb",
              "--input": "#e2dbe7",
              "--accent-soft": "color-mix(in srgb, var(--accent) 12%, #fff)",
              "--accent-border": "color-mix(in srgb, var(--accent) 27%, #fff)",
            }
          : {
              "--foreground": "#f4eff6",
              "--card": "#28222f",
              "--card-foreground": "#f4eff6",
              "--popover": "#28222f",
              "--popover-foreground": "#f4eff6",
              "--secondary": "#352d3e",
              "--secondary-foreground": "#f4eff6",
              "--muted": "#302938",
              "--muted-foreground": "#b6adbd",
              "--border": "#423848",
              "--input": "#463b4d",
              "--accent-soft": "color-mix(in srgb, var(--accent) 20%, #24202b)",
              "--accent-border":
                "color-mix(in srgb, var(--accent) 40%, #24202b)",
            };
        document.documentElement.style.setProperty(
          "--background",
          settings.backgroundColor,
        );
        Object.entries(tokens).forEach(([token, value]) => {
          document.documentElement.style.setProperty(token, value);
        });
      } else {
        [
          "--background",
          "--foreground",
          "--card",
          "--card-foreground",
          "--popover",
          "--popover-foreground",
          "--secondary",
          "--secondary-foreground",
          "--muted",
          "--muted-foreground",
          "--border",
          "--input",
          "--accent-soft",
          "--accent-border",
        ].forEach((token) => {
          document.documentElement.style.removeProperty(token);
        });
      }
    }
  }, [ready, settings]);
  useEffect(() => {
    if (ready) writeStorage(STORAGE_KEYS.subjects, subjects);
  }, [ready, subjects]);
  useEffect(() => {
    if (ready) writeStorage(STORAGE_KEYS.sessions, sessions);
  }, [ready, sessions]);

  const record = (
    source: PersistedTimer,
    status: "completed" | "interrupted",
  ) => {
    if (
      source.elapsedFocusSeconds < MIN_SESSION_SECONDS ||
      !source.subjectName ||
      !source.sessionStartedAt
    )
      return;
    const subjectName = source.subjectName;
    const sessionStartedAt = source.sessionStartedAt;
    setSessions((items) => [
      {
        id: makeId(),
        subjectId: source.subjectId,
        subjectName,
        startedAt: sessionStartedAt,
        endedAt: new Date().toISOString(),
        plannedSeconds: source.plannedSeconds,
        actualSeconds: source.elapsedFocusSeconds,
        status,
      },
      ...items,
    ]);
  };
  const beep = () => {
    if (!settings.sound) return;
    const audio = new AudioContext();
    const tone = audio.createOscillator();
    tone.frequency.value = 740;
    tone.connect(audio.destination);
    tone.start();
    tone.stop(audio.currentTime + 0.22);
  };
  const advance = (source: PersistedTimer) => {
    const completedFocus = source.mode === "focus";
    if (completedFocus) {
      record(
        { ...source, elapsedFocusSeconds: source.plannedSeconds },
        "completed",
      );
      beep();
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1800);
    }
    const cycles = completedFocus
      ? source.completedFocusesInCycle + 1
      : source.completedFocusesInCycle;
    const nextMode: TimerMode = completedFocus
      ? cycles >= settings.cyclesUntilLongBreak
        ? "longBreak"
        : "shortBreak"
      : "focus";
    const seconds =
      nextMode === "focus"
        ? settings.focusMinutes * 60
        : nextMode === "shortBreak"
          ? settings.shortBreakMinutes * 60
          : settings.longBreakMinutes * 60;
    setTimer({
      ...source,
      mode: nextMode,
      remainingSeconds: seconds,
      plannedSeconds: seconds,
      isRunning: settings.autoStart,
      endTime: settings.autoStart ? Date.now() + seconds * 1000 : null,
      elapsedFocusSeconds: 0,
      sessionStartedAt: null,
      completedFocusesInCycle:
        nextMode === "focus" && source.mode === "longBreak" ? 0 : cycles,
    });
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: o intervalo lê o estado atual por ref e não deve ser recriado a cada renderização.
  useEffect(() => {
    const tick = () => {
      const source = timerRef.current;
      if (!source.isRunning || !source.endTime) return;
      const remaining = Math.max(
        0,
        Math.ceil((source.endTime - Date.now()) / 1000),
      );
      const elapsed =
        source.mode === "focus"
          ? Math.min(
              source.plannedSeconds,
              source.elapsedFocusSeconds +
                Math.max(0, source.remainingSeconds - remaining),
            )
          : 0;
      if (!remaining)
        advance({
          ...source,
          remainingSeconds: 0,
          elapsedFocusSeconds: elapsed,
          isRunning: false,
          endTime: null,
        });
      else
        setTimer((previous) =>
          previous.isRunning
            ? {
                ...previous,
                remainingSeconds: remaining,
                elapsedFocusSeconds: elapsed,
              }
            : previous,
        );
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [settings]);

  const reset = (mode: TimerMode, seconds?: number) => {
    const duration =
      seconds ??
      (mode === "focus"
        ? settings.focusMinutes * 60
        : mode === "shortBreak"
          ? settings.shortBreakMinutes * 60
          : settings.longBreakMinutes * 60);
    setTimer((previous) => ({
      ...previous,
      mode,
      remainingSeconds: duration,
      plannedSeconds: duration,
      isRunning: false,
      endTime: null,
      elapsedFocusSeconds: 0,
      sessionStartedAt: null,
    }));
  };
  const toggle = () =>
    setTimer((previous) =>
      previous.isRunning
        ? { ...previous, isRunning: false, endTime: null }
        : {
            ...previous,
            isRunning: true,
            endTime: Date.now() + previous.remainingSeconds * 1000,
            sessionStartedAt:
              previous.mode === "focus" && !previous.sessionStartedAt
                ? new Date().toISOString()
                : previous.sessionStartedAt,
          },
    );
  const request = (action: Exclude<Pending, null>) =>
    timer.mode === "focus" && timer.elapsedFocusSeconds >= MIN_SESSION_SECONDS
      ? setPending(action)
      : action === "skip"
        ? advance({ ...timer, isRunning: false, endTime: null })
        : reset(timer.mode, timer.plannedSeconds);
  const resolvePending = (save: boolean) => {
    const source = timerRef.current;
    if (save) record(source, "interrupted");
    if (pending === "skip")
      advance({ ...source, isRunning: false, endTime: null });
    else if (pending === "end") reset("focus");
    else reset(source.mode, source.plannedSeconds);
    setPending(null);
  };
  const saveSubject = () => {
    const name = newName.trim();
    if (
      !name ||
      subjects.some(
        (item) =>
          normalizeName(item.name) === normalizeName(name) &&
          item.id !== editingId,
      )
    )
      return;
    if (editingId)
      setSubjects((items) =>
        items.map((item) => (item.id === editingId ? { ...item, name } : item)),
      );
    else {
      const subject = { id: makeId(), name, color: "#9a7ad8" };
      setSubjects((items) => [...items, subject]);
      setTimer((item) => ({
        ...item,
        subjectId: subject.id,
        subjectName: subject.name,
      }));
    }
    setNewName("");
    setEditingId(null);
  };
  const exportData = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            settings,
            subjects,
            sessions,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pomodoro-da-karolzinha-dados.json";
    link.click();
    URL.revokeObjectURL(url);
  };
  const importData = (file?: File) => {
    if (
      !file ||
      !window.confirm("A importação substituirá os dados atuais. Continuar?")
    )
      return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (
          data?.version !== 1 ||
          !Array.isArray(data.subjects) ||
          !Array.isArray(data.sessions)
        )
          throw new Error();
        const importedSettings = normalizeSettings({
          ...DEFAULT_SETTINGS,
          ...(data.settings || {}),
        });
        setSettings(importedSettings);
        setSubjects(data.subjects);
        setSessions(data.sessions);
        setTimer(defaultTimer(importedSettings));
      } catch {
        window.alert(
          "Arquivo inválido. Escolha uma exportação do Pomodoro da Karolzinha.",
        );
      }
    };
    reader.readAsText(file);
  };

  const activeSubject =
    subjects.find((item) => item.id === timer.subjectId) || subjects[0];
  const today = getTodaySessions(sessions);
  const week = getWeekSessions(sessions);
  const subjectTotals = getStudyTimeBySubject(week);
  const days = weeklyDays(week);
  const maxDay = Math.max(1, ...days.map((day) => day.seconds));
  const groups = useMemo(
    () =>
      (filter === "Todas"
        ? sessions
        : sessions.filter((item) => item.subjectName === filter)
      ).reduce<Record<string, StudySession[]>>((all, item) => {
        const key = new Date(item.endedAt).toDateString();
        const entries = all[key] ?? [];
        entries.push(item);
        all[key] = entries;
        return all;
      }, {}),
    [filter, sessions],
  );
  if (!ready || showSplash)
    return (
      <main className="loading brand-loading">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
        >
          <Image
            className="brand-mark"
            src="/brand/karol-mark.png"
            alt="Marca da Karolzinha"
            width={72}
            height={72}
            priority
          />
          <strong>Pomodoro da Karolzinha</strong>
          <p>Preparando seu foco…</p>
        </motion.div>
      </main>
    );

  return (
    <main className="app-shell">
      <AnimatePresence>
        {celebrate && (
          <motion.div
            className="confetti"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 28 }, (_, index) => (
              <motion.i
                key={`confetti-${index * 17}`}
                style={{
                  left: `${(index * 17) % 100}%`,
                  background: ["#7c6ee6", "#ee9bb9", "#f4c76e", "#79caa8"][
                    index % 4
                  ],
                }}
                initial={{ y: -25, rotate: 0 }}
                animate={{ y: "100dvh", rotate: 390 }}
                transition={{
                  duration: 1.4 + (index % 5) * 0.12,
                  ease: "easeIn",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <header className="app-header">
        <div className="brand-lockup">
          <Image
            className="header-logo"
            src="/brand/karol-logo.png"
            alt="Pomodoro da Karolzinha"
            width={280}
            height={94}
            priority
          />
          <p className="eyebrow">ENEM · 2026</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="header-settings"
          onClick={() => setSettingsOpen(true)}
          aria-label="Configurações"
        >
          <Settings2 size={18} />
        </Button>
      </header>
      <Tabs value={view} onValueChange={(value) => setView(value as View)}>
        <TabsList className="tabs">
          <TabsTrigger value="focus">
            <Clock3 size={16} /> Foco
          </TabsTrigger>
          <TabsTrigger value="progress">
            <BarChart3 size={16} /> Seu estudo
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {view === "focus" ? (
        <section className="focus-view">
          <div className="mode-switch">
            {modeData.map((mode) => (
              <Button
                variant={timer.mode === mode.id ? "secondary" : "ghost"}
                size="sm"
                key={mode.id}
                onClick={() => reset(mode.id)}
                disabled={timer.isRunning}
              >
                {mode.label}
              </Button>
            ))}
          </div>
          {timer.mode === "focus" && (
            <>
              <p className="field-label">Matéria</p>
              <Button
                variant="outline"
                className="subject-picker"
                onClick={() => setSubjectOpen(true)}
              >
                <span
                  className="subject-dot"
                  style={{ background: activeSubject?.color }}
                />
                {timer.subjectName}
                <ChevronDown size={17} />
              </Button>
              <div className="duration-row">
                {[25, 40, 50, 60].map((minutes) => (
                  <Button
                    key={minutes}
                    variant={
                      timer.plannedSeconds === minutes * 60 && !timer.isRunning
                        ? "secondary"
                        : "ghost"
                    }
                    size="sm"
                    onClick={() => reset("focus", minutes * 60)}
                    disabled={timer.isRunning}
                  >
                    {minutes} min
                  </Button>
                ))}
                <Button
                  variant={
                    [90, 120, 150, 180].includes(timer.plannedSeconds / 60) &&
                    !timer.isRunning
                      ? "secondary"
                      : "ghost"
                  }
                  size="sm"
                  onClick={() => setShowMoreDurations((open) => !open)}
                  disabled={timer.isRunning}
                >
                  {[90, 120, 150, 180].includes(timer.plannedSeconds / 60)
                    ? `${timer.plannedSeconds / 60} min`
                    : "Mais"}
                </Button>
              </div>
              {showMoreDurations && (
                <div className="duration-extra-row">
                  {[90, 120, 150, 180].map((minutes) => (
                    <Button
                      key={minutes}
                      variant={
                        timer.plannedSeconds === minutes * 60 &&
                        !timer.isRunning
                          ? "secondary"
                          : "ghost"
                      }
                      size="sm"
                      onClick={() => {
                        reset("focus", minutes * 60);
                        setShowMoreDurations(false);
                      }}
                      disabled={timer.isRunning}
                    >
                      {minutes} min
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="timer-card">
              <CardContent>
                <p className="timer-subject">
                  {timer.mode === "focus"
                    ? timer.subjectName
                    : timer.mode === "shortBreak"
                      ? "Pausa curta"
                      : "Pausa longa"}
                </p>
                <div className="clock">
                  {formatClock(timer.remainingSeconds)}
                </div>
                <p className="timer-status">
                  {timer.isRunning
                    ? timer.mode === "focus"
                      ? "Em foco"
                      : "Descansando"
                    : "Pronta para começar"}
                </p>
                <Button className="start-button" size="lg" onClick={toggle}>
                  {timer.isRunning ? <Pause /> : <Play fill="currentColor" />}{" "}
                  {timer.isRunning
                    ? "Pausar"
                    : timer.remainingSeconds === timer.plannedSeconds
                      ? "Começar"
                      : "Continuar"}
                </Button>
                <div className="timer-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => request("restart")}
                  >
                    <RotateCcw /> Reiniciar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => request("skip")}
                  >
                    <SkipForward /> Pular
                  </Button>
                  {timer.mode === "focus" &&
                    timer.elapsedFocusSeconds >= MIN_SESSION_SECONDS && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => request("end")}
                      >
                        <TimerReset /> Encerrar
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.p
            className="phrase"
            animate={{ y: timer.isRunning ? [0, -2, 0] : 0 }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          >
            {timer.mode === "focus"
              ? phrase(timer.subjectName || "seu estudo")
              : "Respira, toma uma água e volta quando estiver pronta."}
          </motion.p>
          <Card className="today-card">
            <CardContent>
              <span>Hoje</span>
              <div className="today-stats">
                <strong>
                  {formatDuration(getTotalStudyTime(today))} estudados
                </strong>
                <small>
                  {today.length} {today.length === 1 ? "sessão" : "sessões"}
                </small>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="progress-view">
          <div className="summary-grid">
            <Card>
              <CardContent>
                <span>Hoje</span>
                <strong>{formatDuration(getTotalStudyTime(today))}</strong>
                <small>{today.length} sessões</small>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <span>Esta semana</span>
                <strong>{formatDuration(getTotalStudyTime(week))}</strong>
                <small>{week.length} sessões</small>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent>
              <h2>Ritmo da semana</h2>
              {week.length ? (
                <div className="chart">
                  {days.map((day) => (
                    <div key={day.label}>
                      <div className="bar-wrap">
                        <motion.i
                          initial={{ height: 0 }}
                          animate={{
                            height: `${Math.max(6, (day.seconds / maxDay) * 100)}%`,
                          }}
                        />
                      </div>
                      <b>{day.label}</b>
                      <small>
                        {day.seconds ? formatDuration(day.seconds) : "—"}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty">
                  Seu ritmo vai aparecer aqui depois do primeiro foco.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h2>Por matéria</h2>
              {subjectTotals.length ? (
                <div className="subject-summary">
                  {subjectTotals.map(([name, seconds]) => (
                    <div key={name}>
                      <span>{name}</span>
                      <strong>{formatDuration(seconds)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty">Ainda não tem sessões nesta semana.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="section-title">
                <h2>Histórico</h2>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option>Todas</option>
                  {[...new Set(sessions.map((item) => item.subjectName))].map(
                    (name) => (
                      <option key={name}>{name}</option>
                    ),
                  )}
                </select>
              </div>
              {Object.keys(groups).length ? (
                Object.entries(groups).map(([date, items]) => (
                  <div className="history-group" key={date}>
                    <h3>
                      {localDay(date) === localDay(new Date())
                        ? "Hoje"
                        : new Intl.DateTimeFormat("pt-BR", {
                            dateStyle: "medium",
                          }).format(new Date(date))}
                    </h3>
                    {items.map((item) => (
                      <div className="history-item" key={item.id}>
                        <span>
                          <b>{item.subjectName}</b>
                          <small>
                            {new Intl.DateTimeFormat("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(item.endedAt))}{" "}
                            ·{" "}
                            {item.status === "completed"
                              ? "Concluída"
                              : "Interrompida"}
                          </small>
                        </span>
                        <strong>{formatDuration(item.actualSeconds)}</strong>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm("Excluir esta sessão?"))
                              setSessions((all) =>
                                all.filter((session) => session.id !== item.id),
                              );
                          }}
                          aria-label="Excluir sessão"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p className="empty">
                  Ainda não tem nenhuma sessão por aqui.
                  <br />
                  Escolha uma matéria e comece seu primeiro foco :)
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}
      <Sheet open={subjectOpen} onOpenChange={setSubjectOpen}>
        <SheetContent side="bottom" className="subject-sheet">
          <SheetHeader>
            <SheetTitle>Matérias</SheetTitle>
          </SheetHeader>
          <div className="subject-list">
            {subjects.map((subject) => (
              <div key={subject.id}>
                <Button
                  variant="ghost"
                  className="subject-option"
                  onClick={() => {
                    setTimer((old) => ({
                      ...old,
                      subjectId: subject.id,
                      subjectName: subject.name,
                    }));
                    setSubjectOpen(false);
                  }}
                >
                  <i style={{ background: subject.color }} />
                  {subject.name}
                  {timer.subjectId === subject.id && <Check />}
                </Button>
                {!subject.isDefault && (
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(subject.id);
                        setNewName(subject.name);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Excluir ${subject.name}? O histórico será mantido.`,
                          )
                        )
                          setSubjects((all) =>
                            all.filter((item) => item.id !== subject.id),
                          );
                      }}
                    >
                      Excluir
                    </Button>
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="new-subject">
            <span>{editingId ? "Renomear matéria" : "Nova matéria"}</span>
            <Input
              aria-label={editingId ? "Renomear matéria" : "Nova matéria"}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Ex.: Gramática"
              maxLength={40}
            />
            <Button onClick={saveSubject}>
              <Plus /> {editingId ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="settings-sheet">
          <SheetHeader>
            <SheetTitle>Configurações</SheetTitle>
          </SheetHeader>
          <div className="settings">
            <Card className="settings-card">
              <CardContent className="settings-group">
                <p>APARÊNCIA</p>
                <span className="setting-label">Tema</span>
                <Select
                  value={settings.theme}
                  onValueChange={(theme) =>
                    setSettings((old) => ({
                      ...old,
                      theme: theme as Settings["theme"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">Automático</SelectItem>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                  </SelectContent>
                </Select>
                <span className="setting-label">Cor principal</span>
                <div className="accent-presets">
                  {["#7c6ee6", "#d86694", "#4b83d3", "#4f9d78", "#dc9866"].map(
                    (color) => (
                      <Button
                        key={color}
                        variant="ghost"
                        size="icon"
                        className={
                          settings.accent === color
                            ? "accent-option selected"
                            : "accent-option"
                        }
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          setSettings((old) => ({ ...old, accent: color }))
                        }
                        aria-label={`Usar cor ${color}`}
                      >
                        {settings.accent === color && <Check />}
                      </Button>
                    ),
                  )}
                  <label className="custom-accent" title="Cor personalizada">
                    <Plus size={16} />
                    <input
                      aria-label="Escolher cor personalizada"
                      type="color"
                      value={settings.accent}
                      onChange={(event) =>
                        setSettings((old) => ({
                          ...old,
                          accent: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <span className="setting-label">Fundo</span>
                <div className="background-presets">
                  {[
                    null,
                    "#fff3f8",
                    "#eef5ff",
                    "#eef8f0",
                    "#fff5e9",
                    "#211b2a",
                  ].map((color, index) => (
                    <Button
                      key={color ?? "default"}
                      variant="ghost"
                      size="icon"
                      className={
                        settings.backgroundColor === color
                          ? "background-option selected"
                          : "background-option"
                      }
                      style={{
                        background:
                          color ??
                          "linear-gradient(135deg, #fff 50%, #28222f 50%)",
                      }}
                      onClick={() =>
                        setSettings((old) => ({
                          ...old,
                          backgroundColor: color,
                        }))
                      }
                      aria-label={
                        index === 0
                          ? "Usar fundo do tema"
                          : `Usar fundo ${color}`
                      }
                    >
                      {settings.backgroundColor === color && <Check />}
                    </Button>
                  ))}
                  <label className="custom-accent" title="Fundo personalizado">
                    <Plus size={16} />
                    <input
                      aria-label="Escolher fundo personalizado"
                      type="color"
                      value={settings.backgroundColor ?? "#fcfaff"}
                      onChange={(event) =>
                        setSettings((old) => ({
                          ...old,
                          backgroundColor: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <span className="setting-label">Prévia</span>
                <div className="theme-preview">
                  <span>Pomodoro da Karolzinha</span>
                  <small>Matemática</small>
                  <strong>25:00</strong>
                  <i>Começar</i>
                </div>
              </CardContent>
            </Card>
            <Separator />
            <Card className="settings-card">
              <CardContent className="settings-group">
                <p>POMODORO</p>
                {(
                  [
                    ["Foco", "focusMinutes", 5, 180],
                    ["Pausa curta", "shortBreakMinutes", 5, 60],
                    ["Pausa longa", "longBreakMinutes", 5, 90],
                  ] as const
                ).map(([label, field, min, max]) => (
                  <div className="stepper" key={field}>
                    <span>{label}</span>
                    <Select
                      value={String(settings[field])}
                      onValueChange={(value) =>
                        setSettings((old) => ({
                          ...old,
                          [field]: Number(value),
                        }))
                      }
                    >
                      <SelectTrigger className="duration-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {Array.from(
                          { length: (max - min) / 5 + 1 },
                          (_, index) => min + index * 5,
                        ).map((minutes) => (
                          <SelectItem key={minutes} value={String(minutes)}>
                            {minutes} min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Separator />
            <Card className="settings-card">
              <CardContent className="settings-group">
                <p>PREFERÊNCIAS</p>
                <div className="setting-switch">
                  <span>Iniciar próximo bloco automaticamente</span>
                  <Switch
                    checked={settings.autoStart}
                    onCheckedChange={(autoStart) =>
                      setSettings((old) => ({ ...old, autoStart }))
                    }
                  />
                </div>
                <div className="setting-switch">
                  <span>Som ao terminar</span>
                  <Switch
                    checked={settings.sound}
                    onCheckedChange={(sound) =>
                      setSettings((old) => ({ ...old, sound }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <Separator />
            <Card className="settings-card">
              <CardContent className="settings-group data-actions">
                <p>DADOS</p>
                <Button variant="outline" onClick={exportData}>
                  <Download /> Exportar meus dados
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileUp /> Importar dados
                </Button>
                <input
                  ref={fileRef}
                  className="hidden"
                  type="file"
                  accept="application/json"
                  onChange={(event) => importData(event.target.files?.[0])}
                />
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Limpar todo o histórico de estudos? Esta ação não pode ser desfeita.",
                      )
                    )
                      setSessions([]);
                  }}
                >
                  <Trash2 /> Limpar histórico
                </Button>
                <small>Seus dados ficam somente neste navegador.</small>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending === "end" ? "Encerrar sessão?" : "Guardar este estudo?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você estudou {formatDuration(timer.elapsedFocusSeconds)} nesta
              sessão. Deseja registrar esse tempo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={() => resolvePending(false)}>
              Descartar
            </Button>
            <AlertDialogAction onClick={() => resolvePending(true)}>
              Registrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
