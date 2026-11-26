import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'trainings', loadComponent: () => import('./pages/training-list.component').then(m => m.TrainingListComponent) },
  { path: 'trainings/new', loadComponent: () => import('./pages/training-editor.component').then(m => m.TrainingEditorComponent) },
  { path: 'trainings/:id/edit', loadComponent: () => import('./pages/training-editor.component').then(m => m.TrainingEditorComponent) },
  { path: 'trainings/:id/play', loadComponent: () => import('./pages/player.component').then(m => m.PlayerComponent) },
  { path: 'trainings/:id', loadComponent: () => import('./pages/training-detail.component').then(m => m.TrainingDetailComponent) },
  { path: 'workouts', loadComponent: () => import('./pages/workout-list.component').then(m => m.WorkoutListComponent) },
  { path: 'workouts/new', loadComponent: () => import('./pages/workout-editor.component').then(m => m.WorkoutEditorComponent) },
  { path: 'workouts/:id/edit', loadComponent: () => import('./pages/workout-editor.component').then(m => m.WorkoutEditorComponent) },
  { path: 'workouts/:id/play', loadComponent: () => import('./pages/player.component').then(m => m.PlayerComponent) },
  { path: 'exercises/new', loadComponent: () => import('./pages/exercise-editor.component').then(m => m.ExerciseEditorComponent) },
  { path: 'exercises/:id/edit', loadComponent: () => import('./pages/exercise-editor.component').then(m => m.ExerciseEditorComponent) },
  { path: 'exercises', loadComponent: () => import('./pages/exercise-list.component').then(m => m.ExerciseListComponent) },
  { path: 'data', loadComponent: () => import('./pages/data.component').then(m => m.DataComponent) },
  { path: 'plans', redirectTo: 'workouts', pathMatch: 'full' },   // alte Links
  { path: 'plans/new', redirectTo: 'workouts/new' },
  { path: 'plans/:id/edit', redirectTo: 'workouts/:id/edit' },
  { path: 'plans/:id/play', redirectTo: 'workouts/:id/play' },
  { path: '**', redirectTo: 'dashboard' },
];
