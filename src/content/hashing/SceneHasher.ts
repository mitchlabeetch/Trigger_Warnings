// src/content/hashing/SceneHasher.ts
import { Logger } from '@shared/utils/logger';

const logger = new Logger('SceneHasher');

// --- Hashing Configuration ---
const HASH_SIZE = 8; // 8x8 grid for a 64-bit hash
const CACHE_CHECK_INTERVAL = 2000; // 2 seconds

// --- IndexedDB Configuration ---
const DB_NAME = 'SceneHashCacheDB';
const DB_VERSION = 1;
const STORE_NAME = 'sceneHashes';

interface SceneHashRecord {
  hash: string;
  status: 'Safe' | 'Trigger';
  timestamp: number;
}

export class SceneHasher {
  private video: HTMLVideoElement | null = null;
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D | null;
  private db: IDBDatabase | null = null;
  private checkInterval: number | null = null;

  private onCacheHit: ((status: 'Safe' | 'Trigger') => void) | null = null;

  constructor() {
    this.canvas = new OffscreenCanvas(HASH_SIZE, HASH_SIZE);
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = true;
    }
    this.initDB();
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'hash' });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                logger.info('✅ Perceptual hash cache (IndexedDB) initialized.');
                resolve();
            };

            request.onerror = () => {
                logger.error('❌ Failed to initialize IndexedDB for scene hashing:', request.error);
                reject(request.error);
            };
        } catch (error) {
            logger.error('❌ IndexedDB is not available in this environment.');
            reject(error);
        }
    });
  }

  public initialize(video: HTMLVideoElement): void {
    this.video = video;
  }

  public onDetection(callback: (status: 'Safe' | 'Trigger') => void): void {
      this.onCacheHit = callback;
  }

  public async generateHashForCurrentFrame(): Promise<string | null> {
    if (!this.ctx || !this.video) return null;

    try {
      // 1. Draw, 2. Grayscale, 3. Average, 4. Hash
      this.ctx.drawImage(this.video, 0, 0, HASH_SIZE, HASH_SIZE);
      const imageData = this.ctx.getImageData(0, 0, HASH_SIZE, HASH_SIZE);
      const grayscale = new Uint8Array(HASH_SIZE * HASH_SIZE);
      for (let i = 0, j = 0; i < imageData.data.length; i += 4, j++) {
        grayscale[j] = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
      }
      const avgLuminance = grayscale.reduce((sum, val) => sum + val, 0) / grayscale.length;
      let hash = '';
      for (let i = 0; i < grayscale.length; i++) {
        hash += grayscale[i] < avgLuminance ? '0' : '1';
      }
      return hash;
    } catch (error) {
        logger.warn('⚠️ Could not generate perceptual hash, canvas may be tainted.');
        return null;
    }
  }

  public checkCache(hash: string): Promise<'Safe' | 'Trigger' | null> {
    return new Promise((resolve) => {
        if (!this.db) return resolve(null);

        const transaction = this.db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(hash);

        request.onsuccess = () => {
            const record = request.result as SceneHashRecord | undefined;
            if (record) {
                logger.info(`CACHE HIT: Scene hash ${hash} found. Status: ${record.status}`);
                resolve(record.status);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => resolve(null);
    });
  }

  public storeHash(hash: string, status: 'Safe' | 'Trigger'): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!this.db) return reject('DB not initialized');

        const transaction = this.db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const record: SceneHashRecord = { hash, status, timestamp: Date.now() };

        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  }

  public dispose(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.db?.close();
  }
}
