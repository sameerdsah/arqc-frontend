import { Routes } from '@angular/router';

// The page shown is decided in app.ts from the URL,
// so every address is accepted here and handled there.
export const routes: Routes = [
  { path: '**', children: [] }
];