import { Component, WritableSignal, computed, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './services/supabase.service';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../environments/environment';
import { UserDataModel } from './models/user-data.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _innerUserData: WritableSignal<UserDataModel | null> = signal(null);

  readonly userData = computed(() => this._innerUserData());

  constructor() {
    const google = (window as any).google;
    this.loadUserData();

    window.onload = () => {
      google.accounts.id.initialize({
        client_id:
          environment.google.clientId,
        callback: this.handleSignInWithGoogle.bind(this),
      });
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large' } // customization attributes
      );
      google.accounts.id.prompt(); // also display the One Tap dialog
    };
  }

  handleSignInWithGoogle(response: any) {
    this._supabaseService.supabaseClient.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce: 'NONCE', // must be the same one as provided in data-nonce (if any)
      }).then(() => {
        this.loadUserData();
      });

  }

  private loadUserData(): void {
    this._supabaseService.getUser().subscribe({
      next: v => {
        this._innerUserData.set(v);
      }
    })
  }
}
