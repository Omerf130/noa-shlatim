"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { loginAdmin, type LoginFormState } from "@/app/admin/login/actions";
import styles from "./AdminLoginForm.module.scss";

const initialState: LoginFormState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form className={styles.form} action={formAction}>
      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}

      <label className={styles.field}>
        <span className={styles.label}>אימייל</span>
        <input
          className={styles.input}
          type="email"
          name="email"
          autoComplete="username"
          required
          disabled={pending}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>סיסמה</span>
        <input
          className={styles.input}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
          disabled={pending}
        />
      </label>

      <Button type="submit" variant="primary" disabled={pending} className={styles.submit}>
        {pending ? "מתחבר…" : "התחברות"}
      </Button>
    </form>
  );
}
