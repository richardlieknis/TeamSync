import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { SignUpComponent } from './components/auth/sign-up/sign-up.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'sign-up', component: SignUpComponent },
  { path: 'dashboard', component: DashboardComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
