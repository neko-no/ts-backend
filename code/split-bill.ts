import { Err, Ok, type Result } from './result.ts';
import { NumberOfMembersError } from './number-of-members-error.ts';
import { IndivisibleBillError } from './indivisible-bill-error.ts';


const splitBill = (bill: number, members: number): Result<number, NumberOfMembersError | IndivisibleBillError> => {
  // 事前条件の確認
  if (members < 2) {
    return Err(NumberOfMembersError.create(members));
  }

  const calculated = bill / members;

  // 事後条件の確認
  if(!Number.isInteger(calculated)) {
    return Err(IndivisibleBillError.create(bill, members, calculated));
  }

  return Ok(calculated);
}



// 網羅性チェック用。到達したら型の検査をすり抜けた不具合（Defect）なので例外にする
const assertNever = (value: never): never => {
  throw new Error(`想定外の値です: ${JSON.stringify(value)}`);
};

const printError = (
  error: NumberOfMembersError | IndivisibleBillError,
): void => {
  switch (error.kind) {
    case NumberOfMembersError.kind:
      console.error(`${error.message}（指定: ${error.members}人）`);
      break;
    case IndivisibleBillError.kind:
      console.error(
        `${error.message}（${error.bill} ÷ ${error.members} = ${error.calculated}）`,
      );
      break;
    default:
      assertNever(error);
  }
};

const result = splitBill(100, 1);
if(result.ok) {
  console.log(`Product: ${result.data.toString()}`);
} else {
  printError(result.error);
}