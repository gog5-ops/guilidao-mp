/**
 * In-memory mock of the Taro Cloud DB API surface.
 * Used in H5 mode where Taro Cloud is unavailable.
 */

type Record_ = { _id: string; [key: string]: unknown };

const STORAGE_KEY = "guilidao_mock_db";
const COUNTER_KEY = "guilidao_mock_id";

const store = new Map<string, Record_[]>();

let idCounter = 0;

function saveToStorage(): void {
  try {
    const obj: Record<string, Record_[]> = {};
    store.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    localStorage.setItem(COUNTER_KEY, String(idCounter));
  } catch {}
}

function loadFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const counter = localStorage.getItem(COUNTER_KEY);
    if (!raw) return false;
    const obj = JSON.parse(raw) as Record<string, Record_[]>;
    for (const [k, v] of Object.entries(obj)) {
      store.set(k, v);
    }
    if (counter) idCounter = parseInt(counter, 10) || 0;
    return store.size > 0;
  } catch { return false; }
}

export function hasPersistedData(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}

function nextId(): string {
  idCounter += 1;
  return `mock_${idCounter}`;
}

function getTable(name: string): Record_[] {
  if (!store.has(name)) {
    store.set(name, []);
  }
  return store.get(name)!;
}

/** Symbol used to tag command objects produced by mockCommand. */
const CMD_TAG = Symbol.for("mockDbCmd");

interface IncCmd {
  [CMD_TAG]: true;
  op: "inc";
  value: number;
}

function isCmd(v: unknown): v is IncCmd {
  return typeof v === "object" && v !== null && CMD_TAG in v;
}

function applyUpdate(existing: Record_, patch: { [key: string]: unknown }): void {
  for (const [key, value] of Object.entries(patch)) {
    if (isCmd(value)) {
      if (value.op === "inc") {
        existing[key] = ((existing[key] as number) || 0) + value.value;
      }
    } else {
      existing[key] = value;
    }
  }
}

function matchesQuery(record: Record_, query: { [key: string]: unknown }): boolean {
  for (const [key, value] of Object.entries(query)) {
    if (record[key] !== value) return false;
  }
  return true;
}

interface MockQuery {
  orderBy(field: string, order: "asc" | "desc"): MockQuery;
  get(): Promise<{ data: Record_[] }>;
}

function createQuery(records: Record_[]): MockQuery {
  let sorted = [...records];
  return {
    orderBy(field: string, order: "asc" | "desc"): MockQuery {
      sorted.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return order === "asc" ? -1 : 1;
        if (bVal == null) return order === "asc" ? 1 : -1;
        if (aVal < bVal) return order === "asc" ? -1 : 1;
        if (aVal > bVal) return order === "asc" ? 1 : -1;
        return 0;
      });
      return this;
    },
    async get() {
      return { data: sorted.map((r) => ({ ...r })) };
    },
  };
}

interface MockDoc {
  get(): Promise<{ data: Record_ }>;
  update(opts: { data: { [key: string]: unknown } }): Promise<void>;
  remove(): Promise<void>;
}

interface MockCollection {
  add(opts: { data: { [key: string]: unknown } }): Promise<{ _id: string }>;
  doc(id: string): MockDoc;
  where(query: { [key: string]: unknown }): MockQuery;
  orderBy(field: string, order: "asc" | "desc"): MockQuery;
  get(): Promise<{ data: Record_[] }>;
}

function mockCollection(name: string): MockCollection {
  return {
    async add(opts) {
      const table = getTable(name);
      const id = nextId();
      const record: Record_ = { _id: id, ...opts.data };
      table.push(record);
      saveToStorage();
      return { _id: id };
    },

    doc(id: string): MockDoc {
      return {
        async get() {
          const table = getTable(name);
          const record = table.find((r) => r._id === id);
          if (!record) {
            throw new Error(`mock-db: doc ${id} not found in ${name}`);
          }
          return { data: { ...record } };
        },
        async update(opts) {
          const table = getTable(name);
          const record = table.find((r) => r._id === id);
          if (!record) {
            throw new Error(`mock-db: doc ${id} not found in ${name}`);
          }
          applyUpdate(record, opts.data);
          saveToStorage();
        },
        async remove() {
          const table = getTable(name);
          const idx = table.findIndex((r) => r._id === id);
          if (idx !== -1) {
            table.splice(idx, 1);
            saveToStorage();
          }
        },
      };
    },

    where(query: { [key: string]: unknown }): MockQuery {
      const table = getTable(name);
      const filtered = table.filter((r) => matchesQuery(r, query));
      return createQuery(filtered);
    },

    orderBy(field: string, order: "asc" | "desc"): MockQuery {
      const table = getTable(name);
      return createQuery([...table]).orderBy(field, order);
    },

    async get() {
      const table = getTable(name);
      return { data: table.map((r) => ({ ...r })) };
    },
  };
}

export const mockCommand = {
  inc(n: number): IncCmd {
    return { [CMD_TAG]: true, op: "inc", value: n } as IncCmd;
  },
};

export function mockDatabase() {
  return {
    collection: mockCollection,
    command: mockCommand,
  };
}

/** Insert a record directly (used by seed data). */
export function seedRecord(collectionName: string, record: Record_): void {
  const table = getTable(collectionName);
  table.push(record);
}

/** Save all current data to localStorage. */
export function persistAll(): void {
  saveToStorage();
}

/** Load persisted data from localStorage. Returns true if data was found. */
export function restoreFromStorage(): boolean {
  return loadFromStorage();
}

/** Clear all mock data (useful for testing). */
export function clearMockData(): void {
  store.clear();
  idCounter = 0;
  try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(COUNTER_KEY); } catch {}
}
