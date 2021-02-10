import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ui-splash-loader',
  templateUrl: './splash-loader.component.html',
  styleUrls: ['./splash-loader.component.scss'],
})
export class SplashLoaderComponent implements OnInit {
  isLoaded: boolean = true;

  constructor() {}

  ngOnInit(): void {}
}
