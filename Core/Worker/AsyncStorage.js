import { AsyncLocalStorage } from 'async_hooks';

export const als = new AsyncLocalStorage();

export function WhoCallMe() {
    const store = als.getStore();
    if (!store) return null;
    return store?.entryPath;
}