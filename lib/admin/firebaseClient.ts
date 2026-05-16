"use client";

import {
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";

import { getFirebaseAuthConfig } from "@/lib/analytics/config";

let authInstance: Auth | null = null;

export function isFirebaseAuthConfigured(): boolean {
  return getFirebaseAuthConfig() !== null;
}

export function getFirebaseAuthApp(): FirebaseApp {
  const config = getFirebaseAuthConfig();
  if (!config) {
    throw new Error(
      "Firebase Auth が未設定です。.env.local に NEXT_PUBLIC_FIREBASE_* を設定してください。",
    );
  }
  if (getApps().length > 0) return getApps()[0]!;
  return initializeApp(config);
}

export function getClientAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseAuthApp());
  }
  return authInstance;
}

export async function signInAdmin(
  email: string,
  password: string,
): Promise<User> {
  const cred = await signInWithEmailAndPassword(
    getClientAuth(),
    email,
    password,
  );
  return cred.user;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(getClientAuth());
}

export function subscribeAuth(
  callback: (user: User | null) => void,
): () => void {
  return onAuthStateChanged(getClientAuth(), callback);
}

export async function getAdminIdToken(): Promise<string | null> {
  const user = getClientAuth().currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function userHasAdminClaim(user: User): Promise<boolean> {
  const result = await user.getIdTokenResult();
  return result.claims.admin === true;
}

export async function userHasStaffOrAdminClaim(user: User): Promise<boolean> {
  const result = await user.getIdTokenResult();
  return result.claims.admin === true || result.claims.staff === true;
}
