export const CATEGORIES: Record<string, { label: string; color: string }> = {
  work: { label: 'работа', color: 'var(--blue)' },
  home: { label: 'дом', color: 'var(--peach)' },
  health: { label: 'здоровье', color: 'var(--green)' },
  fitness: { label: 'спорт', color: 'var(--sky)' },
  finance: { label: 'финансы', color: 'var(--pink)' },
  system: { label: 'system', color: 'var(--overlay0)' },
  other: { label: 'другое', color: 'var(--surface2)' },
};

export const PRIORITIES: Record<string, { label: string; color: string }> = {
  high: { label: 'Высокий', color: 'var(--red)' },
  medium: { label: 'Средний', color: 'var(--peach)' },
  low: { label: 'Низкий', color: 'var(--surface2)' },
};

export const FILE_CATEGORY_COLORS: Record<string, string> = {
  core: 'var(--accent-primary)',
  notes: 'var(--blue)',
  learnings: 'var(--peach)',
  memory: 'var(--pink)',
  configs: 'var(--yellow)',
  scripts: 'var(--green)',
  other: 'var(--surface2)',
};

export const FILE_CATEGORY_LABELS: Record<string, string> = {
  core: 'Ядро',
  notes: 'Заметки',
  learnings: 'Обучение',
  memory: 'Память',
  configs: 'Конфиги',
  scripts: 'Скрипты',
  other: 'Прочее',
};

export const ALLOWED_UPLOAD_EXTENSIONS = ['.md', '.txt', '.json', '.yaml', '.yml'];
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

export const THEMES = [
  { name: 'Mauve / Blue / Green', primary: '#cba6f7', secondary: '#89b4fa', tertiary: '#a6e3a1' },
  { name: 'Blue / Pink / Peach', primary: '#89b4fa', secondary: '#f5c2e7', tertiary: '#fab387' },
  { name: 'Green / Teal / Sky', primary: '#a6e3a1', secondary: '#94e2d5', tertiary: '#89dceb' },
  { name: 'Yellow / Peach / Mauve', primary: '#f9e2af', secondary: '#fab387', tertiary: '#cba6f7' },
  { name: 'Red / Maroon / Blue', primary: '#f38ba8', secondary: '#eba0ac', tertiary: '#89b4fa' },
  { name: 'Sapphire Dreams', primary: '#74c7ec', secondary: '#b4befe', tertiary: '#89dceb' },
  { name: 'Ocean Depths', primary: '#74c7ec', secondary: '#89b4fa', tertiary: '#94e2d5' },
  { name: 'Lavender Haze', primary: '#b4befe', secondary: '#f5e0dc', tertiary: '#f2cdcd' },
  { name: 'Mystic Purple', primary: '#cba6f7', secondary: '#b4befe', tertiary: '#74c7ec' },
  { name: 'Sunset Blush', primary: '#f5e0dc', secondary: '#f2cdcd', tertiary: '#fab387' },
  { name: 'Autumn Ember', primary: '#fab387', secondary: '#eba0ac', tertiary: '#f5e0dc' },
  { name: 'Candy Pop', primary: '#f5c2e7', secondary: '#fab387', tertiary: '#f9e2af' },
  { name: 'Electric Violet', primary: '#b4befe', secondary: '#cba6f7', tertiary: '#f5c2e7' },
  { name: 'Forest Mint', primary: '#94e2d5', secondary: '#a6e3a1', tertiary: '#74c7ec' },
  { name: 'Neon Nights', primary: '#74c7ec', secondary: '#f5c2e7', tertiary: '#fab387' },
];

export const NAV_ITEMS = [
  { key: 'overview', label: 'Дашборд', icon: '◈', href: '/', bottom: false },
  { key: 'chat', label: 'Чат', icon: '▹', href: '/chat', bottom: false },
  { key: 'tasks', label: 'Задачи', icon: '☰', href: '/tasks', bottom: false },
  { key: 'processes', label: 'Процессы', icon: '⟳', href: '/processes', bottom: false },
  { key: 'skills', label: 'Скиллы', icon: '▦', href: '/skills', bottom: false },
  { key: 'files', label: 'Файлы', icon: '▤', href: '/files', bottom: false },
  { key: 'settings', label: 'Настройки', icon: '⚙', href: '/settings', bottom: true },
];
