import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';

interface TranslationResponse {
  translatedTexts?: unknown;
}

interface PendingText {
  index: number;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class DeepLTranslationService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, string>();
  private readonly inFlightBatches = new Map<string, Observable<string[]>>();

  translateMany(texts: string[]): Observable<string[]> {
    const result = [...texts];
    const pending: PendingText[] = [];

    texts.forEach((text, index) => {
      const normalized = text.trim();
      if (!normalized) {
        return;
      }

      const cached = this.cache.get(normalized);
      if (cached !== undefined) {
        result[index] = cached;
      } else {
        pending.push({ index, text: normalized });
      }
    });

    if (pending.length === 0) {
      return of(result);
    }

    const batches: PendingText[][] = [];
    for (let index = 0; index < pending.length; index += 50) {
      batches.push(pending.slice(index, index + 50));
    }

    return forkJoin(batches.map(batch => this.translateBatch(batch))).pipe(
      map(translatedBatches => {
        translatedBatches.forEach((translated, batchIndex) => {
          batches[batchIndex].forEach((entry, textIndex) => {
            result[entry.index] = translated[textIndex] ?? entry.text;
          });
        });
        return result;
      })
    );
  }

  private translateBatch(batch: PendingText[]): Observable<string[]> {
    const batchKey = JSON.stringify(batch.map(entry => entry.text));
    const currentRequest = this.inFlightBatches.get(batchKey);
    if (currentRequest) {
      return currentRequest;
    }

    const request = this.http.post<TranslationResponse>('/api/traduccion', {
      texts: batch.map(entry => entry.text)
    }).pipe(
      map(response => {
        const translated = Array.isArray(response?.translatedTexts)
          ? response.translatedTexts
          : [];

        return batch.map((entry, index) => {
          const value = translated[index];
          return typeof value === 'string' && value.trim() ? value : entry.text;
        });
      }),
      tap(translated => translated.forEach((value, index) => this.cache.set(batch[index].text, value))),
      catchError(() => of(batch.map(entry => entry.text))),
      finalize(() => this.inFlightBatches.delete(batchKey)),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.inFlightBatches.set(batchKey, request);
    return request;
  }
}
