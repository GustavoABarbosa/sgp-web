<template>
  <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-light p-4">
    <div class="w-full max-w-md rounded-lg border border-border bg-surface p-5 text-center shadow-sm">
      <h1 class="mb-2 text-3xl font-semibold">404</h1>
      <p class="mb-6 text-muted">Página não encontrada.</p>
      <RouterLink
        to="/login"
        class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white no-underline hover:bg-primary-light"
      >
        Ir para login
      </RouterLink>
    </div>
  </div>
</template>
