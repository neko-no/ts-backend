interface Employee { name: string; age: number }
interface Manager extends Employee { grade: number }
interface Executive { name: string; age: number; title: string }
type U = Manager | Executive;

// 1. in 演算子で絞り込む
const describe = (u: U): string => {
  if ('grade' in u) {
    return `${u.name}: grade ${u.grade}`; // u は Manager
  }
  return `${u.name}: ${u.title}`; // u は Executive
};

// 2. 判別プロパティ（tag）で絞り込む
interface ManagerT { tag: 'manager'; name: string; grade: number }
interface ExecutiveT { tag: 'executive'; name: string; title: string }
type UT = ManagerT | ExecutiveT;

const describeT = (u: UT): string => {
  switch (u.tag) {
    case 'manager':
      return `${u.name}: grade ${u.grade}`;
    case 'executive':
      return `${u.name}: ${u.title}`;
  }
};

// 型を確認する（意図どおり絞り込まれているか）
const probe = (u: U) => {
  if ('grade' in u) {
    const m: Manager = u; // OK なら Manager に絞り込まれている
    return m;
  }
  const e: Executive = u; // OK なら Executive に絞り込まれている
  return e;
};
console.log(describe({ name: 'a', age: 1, grade: 3 }), describeT({ tag: 'executive', name: 'b', title: 'CEO' }), probe);
