import { Routes } from '@angular/router';

import { ArqcGenerator } from './discover/arqc-generator/arqc-generator';
import { ArpcGenerator } from './discover/arpc-generator/arpc-generator';
import { TcGenerator } from './discover/tc-generator/tc-generator';
import { AacGenerator } from './discover/aac-generator/aac-generator';

export const routes: Routes = [

  { path: 'discover/arqc', component: ArqcGenerator },
  { path: 'discover/arpc', component: ArpcGenerator },
  { path: 'discover/tc',   component: TcGenerator },
  { path: 'discover/aac',  component: AacGenerator },
];
