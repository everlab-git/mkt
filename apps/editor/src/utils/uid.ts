let _counter = 0;
export const uid = (): string => `f${(++_counter).toString(36)}`;

