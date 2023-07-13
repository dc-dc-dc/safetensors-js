export type TensorMetadata = { dtype: string, shape: number[], data_offsets: number[] };

export class SafeTensor {
    private metadata: Map<string, TensorMetadata>;

    constructor(private buffer: Uint8Array) {
        this.metadata = new Map();
        const metadataLength = Number(new DataView(this.buffer.buffer).getBigUint64(0, true));
        const metadata = JSON.parse(new TextDecoder("utf8").decode(this.buffer.subarray(8, 8 + metadataLength)));
        for (const key in metadata) {
            const v = metadata[key];
            this.metadata.set(key, {
                dtype: v.dtype,
                shape: v.shape,
                data_offsets: v.data_offsets.map(x => 8 + metadataLength + x)
            });
        }
    }

    getTensor(key: string): Uint8Array {
        const metadata = this.metadata.get(key);
        if (!metadata) {
            throw new Error(`Tensor ${key} not found`);
        }
        return this.buffer.subarray(...metadata.data_offsets);
    }
}

let _opendb: IDBDatabase | null = null;
export async function getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window == 'undefined') {
            reject(new Error("indexdb is only available in the browser"));
        }
        if (_opendb != null) {
            resolve(_opendb);
        }
        const request = indexedDB.open("safetensor", 1);
        request.onerror = (event) => {
            reject(event);
        }
        request.onupgradeneeded = (event) => {
            const target = event.target as IDBOpenDBRequest;
            if (target == null) {
                return;
            }
            const db = target.result;
            let objectStore = db.createObjectStore("models", { keyPath: "name" });
            console.log("OBJECT STORE", objectStore);
        };
        request.onsuccess = (event) => {
            const target = event.target as IDBOpenDBRequest;
            if (event.target == null) {
                reject(new Error());
            } else {
                _opendb = target.result;

                resolve(_opendb);
            }
        }
    });
}

export async function getFromIndexDB(key: string): Promise<Uint8Array | null> {
    const db = await getDB();
    const transaction = db.transaction("models", "readonly").objectStore("models");
    return await new Promise((resolve, reject) => {
        const req = transaction.get(key)
        req.onsuccess = (event) => {
            const target = event.target as IDBRequest;
            if (target == null) {
                reject(new Error(`request for ${key} failed`));
            } else {
                resolve(target.result?.raw ?? null);
            }
        }
        req.onerror = (event) => {
            reject(event);
        }
    });
}

async function cacheToIndexDB(key: string, raw: Uint8Array) {
    const db = await getDB();
    const transaction = db.transaction("models", "readwrite").objectStore("models");
    return await new Promise((resolve, reject) => {
        const req = transaction.add({ name: key, raw: raw });
        req.onsuccess = (event) => {
            resolve(event);
        }
        req.onerror = (event) => {
            reject(event);
        }
    })
}

export async function loadSafeTensor(location: string): Promise<SafeTensor> {
    const cached = await getFromIndexDB(location);
    if (cached != null) {
        return new SafeTensor(cached);
    }
    const req = await fetch(location);
    const raw = await req.arrayBuffer();
    const buffer = new Uint8Array(raw);
    await cacheToIndexDB(location, buffer);
    return new SafeTensor(buffer);
}