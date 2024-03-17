import { Component, input } from '@angular/core';

@Component({
  selector: 'app-coin-price',
  standalone: true,
  imports: [],
  templateUrl: './coin-price.component.html',
  styleUrl: './coin-price.component.scss'
})
export class CoinPriceComponent {
  readonly symbol = input.required<string>();
  readonly price = input.required<string>();
}
