// 2.2.1 TypeScript とデータ指向プログラミングの親和性

// 1. 構造的型付け: 継承や委譲がなくても、構造が合えば関数を再利用できる
interface Employee {
  readonly name: string;
  readonly age: number;
}
interface Manager {
  readonly name: string;
  readonly age: number;
  readonly grade: number;
}

const isMinor = (employee: Employee): boolean => employee.age < 20;

const manager: Manager = { name: '佐藤', age: 25, grade: 1 };
console.log(isMinor(manager)); // Manager は Employee と互換なので渡せる

// 2. 型操作: 既存のデータ型から Readonly / Pick で別の型を作る
interface PartTime {
  name: string;
  age: number;
  workHours: number;
}

type ReadonlyPartTime = Readonly<PartTime>;
type EmployeeOfPartTime = Pick<PartTime, 'name' | 'age'>;

const partTime: ReadonlyPartTime = { name: '鈴木', age: 18, workHours: 20 };
const asEmployee: EmployeeOfPartTime = partTime; // name / age だけを持つ型として扱える
console.log(isMinor(asEmployee));
