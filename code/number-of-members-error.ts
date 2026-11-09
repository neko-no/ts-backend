import type { ApplicationError } from './application-error.ts';

const kind = 'NumberOfMembers';


interface NumberOfMembersError extends ApplicationError<typeof kind> {
  readonly members: number;
}



const create = (members: number): NumberOfMembersError => ({
  kind,
  message: '2人以上を指定してください',
  members
});

const NumberOfMembersError = {
  kind,
  create,
} as const;

export { NumberOfMembersError };
