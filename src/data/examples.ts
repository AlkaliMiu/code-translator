import { getMessages, type Messages } from '../i18n'
import type { AppLocale, SupportedLanguage } from '../types/explanation'

export type ExampleId =
  | 'python-loop'
  | 'python-comprehension'
  | 'javascript-array'
  | 'javascript-async'
  | 'typescript-interface'

export interface CodeExample {
  id: ExampleId
  language: SupportedLanguage
  /** Builds the snippet so its string literals follow the interface language. */
  build: (samples: Messages['samples']) => string
}

/** Quotes text as a single-quoted JavaScript string literal. */
const js = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

export const EXAMPLES: CodeExample[] = [
  {
    id: 'python-loop',
    language: 'python',
    build: () => `numbers = range(1, 11)
even_numbers = []

for number in numbers:
    if number % 2 == 0:
        even_numbers.append(number)

print(even_numbers)`,
  },
  {
    id: 'python-comprehension',
    language: 'python',
    build: () => `scores = [72, 48, 91, 65, 39]
passed_scores = [score for score in scores if score >= 60]

print(passed_scores)`,
  },
  {
    id: 'javascript-array',
    language: 'javascript',
    build: ({ products: [bag, mug, notebook] }) => `const products = [
  { name: ${js(bag)}, inStock: true },
  { name: ${js(mug)}, inStock: false },
  { name: ${js(notebook)}, inStock: true }
];

const availableNames = products
  .filter(product => product.inStock)
  .map(product => product.name);

console.log(availableNames);`,
  },
  {
    id: 'javascript-async',
    language: 'javascript',
    build: ({ requestFailed }) => `async function loadUser(userId) {
  const response = await fetch(\`https://api.example.com/users/\${userId}\`);

  if (!response.ok) {
    throw new Error(${js(requestFailed)});
  }

  const user = await response.json();
  return user.name;
}`,
  },
  {
    id: 'typescript-interface',
    language: 'typescript',
    build: ({ greeting, userName }) => `interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return \`${greeting}\`;
}

const message = greet({ name: ${js(userName)}, age: 18 });
console.log(message);`,
  },
]

export function getExampleCode(example: CodeExample, locale: AppLocale): string {
  return example.build(getMessages(locale).samples)
}
