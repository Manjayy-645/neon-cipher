type Props = Record<string, string | number | boolean | null>;

export function track(name: string, props: Props = {}) {
  const entry = { name, props, t: Date.now() };
  console.debug('[analytics]', entry);
  try {
    const key = 'nc.analytics.v1';
    const list = JSON.parse(localStorage.getItem(key) ?? '[]');
    list.push(entry);
    localStorage.setItem(key, JSON.stringify(list.slice(-200)));
  } catch {
    /* ignore */
  }
}
