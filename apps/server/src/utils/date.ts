export const toDateKey = (value = new Date()) => value.toISOString().slice(0, 10);

export const startOfDay = (dateKey: string) => new Date(`${dateKey}T00:00:00.000Z`);

export const getWordCount = (content: string) => {
  const text = content.trim();
  return text ? text.split(/\s+/).length : 0;
};
