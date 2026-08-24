export type StudyMessageState =
  | "idle"
  | "started"
  | "paused"
  | "resumed"
  | "halfway"
  | "almostDone"
  | "completed"
  | "interrupted";

export type StudyMessageContext = {
  subjectName: string;
  plannedMinutes: number;
  remainingSeconds: number;
  progress: number;
  todayStudySeconds: number;
  todaySessions: number;
  weekStudySeconds: number;
  state: StudyMessageState;
  actualSeconds?: number;
};

let lastMessage = "";

const subjectMessages: Record<string, string[]> = {
  Matemática: ["Hoje é dia de fazer conta.", "Uma questão de cada vez."],
  Redação: [
    "Agora é você e a redação.",
    "Ideia, argumento, desenvolvimento. Bora.",
  ],
  Física: ["Física agora. Um problema de cada vez."],
  Biologia: ["Bora de biologia."],
  História: ["Hora de história."],
};

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia, Karol. Bora começar.";
  if (hour < 18) return "Mais um bloco pra tarde.";
  return "Mais um bloco e depois descansa.";
}

function pick(messages: string[]) {
  const options = messages.filter((message) => message !== lastMessage);
  const message = (options.length ? options : messages)[
    Math.floor(Math.random() * (options.length ? options.length : messages.length))
  ];
  lastMessage = message;
  return message;
}

export function getStudyMessage(context: StudyMessageContext) {
  const subject = context.subjectName.toLowerCase();
  const actualMinutes = Math.max(
    1,
    Math.round((context.actualSeconds ?? 0) / 60),
  );
  const genericIdle = [
    `Bora de ${subject}.`,
    `${context.subjectName} hoje. Um bloco de cada vez.`,
    `Preparada pra ${subject}?`,
    `Vamos tirar ${subject} da frente.`,
  ];

  const messages: Record<StudyMessageState, string[]> = {
    idle: [
      ...(context.todaySessions === 0 ? ["Primeiro foco do dia. Bora."] : []),
      ...(context.todaySessions >= 3
        ? [`Você já fez ${context.todaySessions} sessões hoje.`]
        : []),
      ...(context.todayStudySeconds >= 7200
        ? ["Você já passou de 2h hoje. Bom ritmo."]
        : []),
      ...(context.plannedMinutes >= 90
        ? [
            "Bloco grande hoje. Vai no seu ritmo.",
            `${context.plannedMinutes} min é sessão longa. Sem pressa.`,
          ]
        : []),
      ...(subjectMessages[context.subjectName] ?? []),
      ...genericIdle,
      timeGreeting(),
    ],
    started: [
      "Valendo. Agora é só focar.",
      "Começou. Deixa o resto pra depois.",
      `${context.plannedMinutes} min de ${subject}. Bora.`,
      ...(context.plannedMinutes >= 90
        ? ["Foco longo. Se precisar, pausa e volta."]
        : []),
    ],
    paused: [
      "Pausa rápida. Seu progresso está salvo.",
      "Respira e volta quando estiver pronta.",
      "Sem problema. O relógio espera.",
    ],
    resumed: [
      "Voltamos.",
      "Bora terminar esse bloco.",
      "Continua de onde parou.",
    ],
    halfway: [
      "Metade foi.",
      "Já passou da metade, Karolzinha.",
      "Agora falta menos do que você já fez.",
    ],
    almostDone: [
      "Últimos 5 minutos.",
      "Tá acabando.",
      "Só mais um pouquinho.",
    ],
    completed: [
      `Mais ${actualMinutes} min de ${subject} na conta.`,
      `Fechou ${actualMinutes} min. Mandou bem.`,
      `${context.subjectName} concluída por hoje? Você decide.`,
      "Mais uma sessão feita.",
    ],
    interrupted: [
      `Foram ${actualMinutes} min. Ainda contam.`,
      `${actualMinutes} min feitos. Dá pra continuar depois.`,
      "Sessão encerrada, progresso registrado.",
    ],
  };

  return pick(messages[context.state]);
}
