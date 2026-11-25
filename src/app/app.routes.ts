import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'trainings', loadComponent: () => import('./pages/training-list.component').then(m => m.TrainingListComponent) },
  { path: 'trainings/new', loadComponent: () => import('./pages/training-editor.component').then(m => m.TrainingEditorComponent) },
  { path: 'trainings/:id/edit', loadComponent: () => import('./pages/training-editor.component').then(m => m.TrainingEditorComponent) },
  { path: 'trainings/:id/play', loadComponent: () => import('./pages/player.component').then(m => m.PlayerComponent) },
  { path: 'trainings/:id', loadComponent: () => import('./pages/training-detail.component').then(m => m.TrainingDetailComponent) },
  { path: 'plans', loadComponent: () => import('./pages/plan-list.component').then(m => m.PlanListComponent) },
  { path: 'plans/new', loadComponent: () => import('./pages/plan-editor.component').then(m => m.PlanEditorComponent) },
  { path: 'plans/:id/edit', loadComponent: () => import('./pages/plan-editor.component').then(m => m.PlanEditorComponent) },
  { path: 'plans/:id/play', loadComponent: () => import('./pages/player.component').then(m => m.PlayerComponent) },
  { path: 'exercises', loadComponent: () => import('./pages/exercise-list.component').then(m => m.ExerciseListComponent) },
  { path: '**', redirectTo: 'dashboard' },
];
