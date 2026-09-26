import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },   // creates index.html
  { path: '**', renderMode: RenderMode.Client }     // handled in the browser
];