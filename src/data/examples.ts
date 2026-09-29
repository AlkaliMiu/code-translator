import type { SupportedLanguage } from '../types/explanation'

export interface CodeExample {
  id: string
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  language: SupportedLanguage
  code: string
  codeEn: string
}

export const EXAMPLES: CodeExample[] = [
  {
    id: 'python-loop',
    title: '循环与条件',
    titleEn: 'Loops and conditions',
    description: '找出 1～10 中的偶数',
    descriptionEn: 'Find the even numbers from 1 to 10',
    language: 'python',
    code: `numbers = range(1, 11)
even_numbers = []

for number in numbers:
    if number % 2 == 0:
        even_numbers.append(number)

print(even_numbers)`,
    codeEn: `numbers = range(1, 11)
even_numbers = []

for number in numbers:
    if number % 2 == 0:
        even_numbers.append(number)

print(even_numbers)`,
  },
  {
    id: 'python-comprehension',
    title: '列表推导式',
    titleEn: 'List comprehension',
    description: '把合格分数放进新列表',
    descriptionEn: 'Put passing scores in a new list',
    language: 'python',
    code: `scores = [72, 48, 91, 65, 39]
passed_scores = [score for score in scores if score >= 60]

print(passed_scores)`,
    codeEn: `scores = [72, 48, 91, 65, 39]
passed_scores = [score for score in scores if score >= 60]

print(passed_scores)`,
  },
  {
    id: 'javascript-array',
    title: '筛选与映射',
    titleEn: 'Filter and map',
    description: '筛选库存商品并取出名称',
    descriptionEn: 'Keep in-stock products and get their names',
    language: 'javascript',
    code: `const products = [
  { name: '帆布包', inStock: true },
  { name: '马克杯', inStock: false },
  { name: '笔记本', inStock: true }
];

const availableNames = products
  .filter(product => product.inStock)
  .map(product => product.name);

console.log(availableNames);`,
    codeEn: `const products = [
  { name: 'Canvas bag', inStock: true },
  { name: 'Coffee mug', inStock: false },
  { name: 'Notebook', inStock: true }
];

const availableNames = products
  .filter(product => product.inStock)
  .map(product => product.name);

console.log(availableNames);`,
  },
  {
    id: 'javascript-async',
    title: '异步请求',
    titleEn: 'Async request',
    description: '从接口读取用户信息',
    descriptionEn: 'Load user information from an API',
    language: 'javascript',
    code: `async function loadUser(userId) {
  const response = await fetch(\`https://api.example.com/users/\${userId}\`);

  if (!response.ok) {
    throw new Error('请求失败');
  }

  const user = await response.json();
  return user.name;
}`,
    codeEn: `async function loadUser(userId) {
  const response = await fetch(\`https://api.example.com/users/\${userId}\`);

  if (!response.ok) {
    throw new Error('Request failed');
  }

  const user = await response.json();
  return user.name;
}`,
  },
  {
    id: 'typescript-interface',
    title: '接口与函数',
    titleEn: 'Interface and function',
    description: '用类型描述用户并生成问候语',
    descriptionEn: 'Describe a user type and build a greeting',
    language: 'typescript',
    code: `interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return \`你好，\${user.name}！你今年 \${user.age} 岁。\`;
}

const message = greet({ name: '小林', age: 18 });
console.log(message);`,
    codeEn: `interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return \`Hello, \${user.name}! You are \${user.age}.\`;
}

const message = greet({ name: 'Lin', age: 18 });
console.log(message);`,
  },
]
