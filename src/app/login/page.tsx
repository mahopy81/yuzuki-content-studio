import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-white/70 bg-white/58 p-8 shadow-soft backdrop-blur">
        <p className="text-sm font-medium text-champagne">Yuzuki Content Studio</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">ログイン</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          投稿管理の土台に入るための画面です。利用できるメールアドレスは
          <span className="font-medium"> ALLOWED_EMAILS </span>
          で管理します。
        </p>
        <div className="mt-8">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
