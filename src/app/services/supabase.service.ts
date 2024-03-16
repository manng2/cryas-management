import { Injectable } from '@angular/core';
import { AuthChangeEvent, createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { from, Observable, switchMap } from 'rxjs';

export interface IUser {
  email: string;
  name: string;
  website: string;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {

  private supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient = createClient(environment.supabase.url, environment.supabase.key);
  }

  public getUser(): Observable<User | null> {
    return from(this.supabaseClient.auth.getUser().then(it => it.data.user));
  }

  public getSession(): Observable<Session | null> {
    return from(this.supabaseClient.auth.getSession().then(it => it.data.session));
  }

  public getProfile(): Observable<any> {
    return this.getUser().pipe(switchMap(user => this.supabaseClient.from('profiles')
      .select('username, website, avatar_url')
      .eq('id', user)
      .single()))
  }

  public authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void): any {
    return this.supabaseClient.auth.onAuthStateChange(callback);
  }

  public signIn(): Observable<any> {
    return from(this.supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }));
  }

  public signOut(): Promise<any> {
    return this.supabaseClient.auth.signOut();
  }
}