type WithId = {
  id: string;
};

export function upsertById<T extends WithId>(items: T[], next: T) {
  const exists = items.some((item) => item.id === next.id);
  if (!exists) {
    return [...items, next];
  }
  return items.map((item) => (item.id === next.id ? next : item));
}

export function replaceTaskRecord<T>(records: Record<string, T>, taskId: string, value: T) {
  return {
    ...records,
    [taskId]: value,
  };
}

export function upsertTaskRecordItem<T extends WithId>(records: Record<string, T[]>, taskId: string, value: T) {
  return {
    ...records,
    [taskId]: upsertById(records[taskId] ?? [], value),
  };
}
