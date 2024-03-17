import { HttpClientModule } from '@angular/common/http';
import {
  Component,
  Injector,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { environment } from '../environments/environment';
import { UserDataModel } from './models/user-data.model';
import { SupabaseService } from './services/supabase.service';
import { BinanceService } from './services/binance.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CoinPriceComponent } from './components/coin-price/coin-price.component';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  Subject,
  combineLatest,
  debounceTime,
  filter,
  map,
  noop,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NzAvatarModule,
    CoinPriceComponent,
    NzAutocompleteModule,
    ReactiveFormsModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly _injector = inject(Injector);
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _binanceService = inject(BinanceService);
  private readonly _userService = inject(UserService);
  private readonly _innerUserData: WritableSignal<UserDataModel | null> =
    signal(null);
  private readonly _coinPrices = toSignal(this._binanceService.coinPrices);
  private readonly _reloadUserPrices$ = new Subject<void>();

  readonly userData = computed(() => this._innerUserData());
  readonly coinPriceOptions = computed(() =>
    (this._coinPrices() || [])
      .map((coin) => ({
        value: coin.price,
        label: coin.symbol,
      }))
      .filter((coin) =>
        coin.label
          .toLowerCase()
          .includes((this.searchCoinSymbolValueChanges() || '').toLowerCase())
      )
  );
  readonly userCoinPrices = toSignal(
    combineLatest([
      toObservable(this.userData).pipe(filter(Boolean)),
      this._reloadUserPrices$.pipe(startWith(noop)),
    ]).pipe(
      switchMap(([it]) => this._userService.getUserSymbolsSelections(it)),
      map((it) => {
        console.log(it, this.coinPriceOptions()[0]);
        return this._coinPrices()!.filter((coin) => it.includes(coin.symbol))
      }
      ),
    )
  );
  readonly searchCoinSymbolFormControl = new FormControl('');
  private readonly searchCoinSymbolValueChanges = toSignal(
    this.searchCoinSymbolFormControl.valueChanges.pipe(debounceTime(400)),
    {
      injector: this._injector,
    }
  );

  constructor() {
    const google = (window as any).google;
    this.loadUserData();

    window.onload = () => {
      google.accounts.id.initialize({
        client_id: environment.google.clientId,
        callback: this.handleSignInWithGoogle.bind(this),
      });
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large' } // customization attributes
      );
      google.accounts.id.prompt();
    };
  }

  handleSignInWithGoogle(response: any) {
    this._supabaseService.supabaseClient.auth
      .signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce: 'NONCE', // must be the same one as provided in data-nonce (if any)
      })
      .then((data) => {
        console.log('data', data);
        this.loadUserData();
      });
  }

  onSearchCoinSymbol(event: Event): void {
    console.log(event);
  }

  selectCoinPrice(coin: string): void {
    const userData = this._innerUserData()!;

    this._userService.updateUserSymbolSelections(userData, [
      ...this.userCoinPrices()!.map((it) => it.symbol),
      coin,
    ]).subscribe({
      next: () => {
        this._reloadUserPrices$.next();
      }
    });

    this.searchCoinSymbolFormControl.setValue('', {
      emitEvent: false,
    });
  }

  private loadUserData(): void {
    this._supabaseService.getUser().subscribe({
      next: (v) => {
        this._innerUserData.set(v);
      },
    });
  }
}
