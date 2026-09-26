import { Component } from '@angular/core';
import { Routes } from '@angular/router';

// Placeholder: pages are shown by app.html based on the URL,
// so this component is never displayed.
@Component({ template: '' })
class UrlOnly {}

export const routes: Routes = [
  { path: '', component: UrlOnly },    // home page - pre-rendered as index.html
  { path: '**', component: UrlOnly }   // every other address
];