import { Injectable, inject } from '@angular/core';
import { BinanceService } from './binance.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, filter, from, map, noop } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { UserDataModel } from '../models/user-data.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  readonly defaultSymbols = ['BTCUSDT'];
  private readonly _binanceService = inject(BinanceService);
  private readonly _supabaseService = inject(SupabaseService);

  getUserSymbolsSelections(userData: UserDataModel): Observable<string[]> {
    return from(
      this._supabaseService.supabaseClient
        .from('settings')
        .select('symbols')
        .eq('userEmail', userData.email)
        .single()
        .then((it) => it.data?.symbols || this.defaultSymbols)
    );
  }

  updateUserSymbolSelections(userData: UserDataModel, symbols: string[]): Observable<void> {
    return from(this._supabaseService.supabaseClient
      .from('settings')
      .upsert({
        userEmail: userData.email,
        symbols,
      })
      .select().then(noop))
  }
}
