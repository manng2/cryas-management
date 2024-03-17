import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CoinPriceModel } from '../models/coin-price.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BinanceService {
  private readonly _http = inject(HttpClient);

  readonly coinPrices: Observable<CoinPriceModel[]> = this.getPrices();

  private getPrices(): Observable<CoinPriceModel[]> {
    return this._http.get<CoinPriceModel[]>('https://api.binance.com/api/v3/ticker/price');
  }
}
