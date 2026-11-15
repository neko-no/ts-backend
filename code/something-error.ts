import type { ApplicationError } from './application-error.ts';

const kind = 'Something';

interface SomethingError extends ApplicationError<typeof kind> {}

const create = (message: string): SomethingError => ({
  kind,
  message,
});

const SomethingError = {
  kind,
  create,
} as const;

export { SomethingError };
