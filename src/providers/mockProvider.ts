import type {
  Concept,
  ExplainRequest,
  ExplanationProvider,
  ExplanationResult,
  ExplanationStep,
  ExplanationWarning,
} from '../types/explanation'

interface CodeBlock {
  start: number
  end: number
  code: string
}

const wait = (milliseconds: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, milliseconds)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('请求已取消', 'AbortError'))
      },
      { once: true },
    )
  })

function splitBlocks(code: string): CodeBlock[] {
  const lines = code.split('\n')
  const blocks: CodeBlock[] = []
  let start = -1

  const close = (end: number) => {
    if (start === -1) return
    blocks.push({ start: start + 1, end, code: lines.slice(start, end).join('\n') })
    start = -1
  }

  lines.forEach((current, index) => {
    if (current.trim() && start === -1) start = index
    if (!current.trim()) close(index)
  })
  close(lines.length)

  return blocks.flatMap((block) => {
    if (block.end - block.start < 7) return [block]
    const blockLines = block.code.split('\n')
    return blockLines.reduce<CodeBlock[]>((chunks, _, index) => {
      if (index % 4 === 0) {
        chunks.push({
          start: block.start + index,
          end: Math.min(block.start + index + 3, block.end),
          code: blockLines.slice(index, index + 4).join('\n'),
        })
      }
      return chunks
    }, [])
  }).slice(0, 8)
}

function getPurpose(code: string, simplify: boolean, locale: ExplainRequest['locale']): string {
  if (locale === 'en') {
    if (/\.filter\s*\(/.test(code) && /\.map\s*\(/.test(code)) {
      return simplify
        ? 'It picks the items that pass a check, then keeps just the information we need.'
        : 'This code filters a group of data, then transforms the remaining items into the desired result.'
    }
    if (/\bfetch\s*\(/.test(code)) {
      return simplify
        ? 'It asks another service for information, waits for a reply, and then takes out the result.'
        : 'This code sends an asynchronous API request, checks the response, and returns parsed data.'
    }
    if (/\binterface\s+\w+/.test(code)) {
      return simplify
        ? 'It first describes what a user record should look like, then uses that record to make a greeting.'
        : 'This TypeScript code defines a data shape and uses a typed function to produce a result.'
    }
    if (/\[[^\]]+\bfor\b[^\]]+\bif\b[^\]]*\]/s.test(code)) {
      return simplify
        ? 'It checks every item in a list and puts only the matching ones into a new list.'
        : 'This code uses a list comprehension to build a new list containing only matching values.'
    }
    if (/\bfor\b[\s\S]*\bif\b/.test(code)) {
      return simplify
        ? 'It looks at a group of items one by one and collects the ones that pass a check.'
        : 'This code loops through data and uses a condition to collect matching items.'
    }
    if (/\b(function|def)\s+\w+/.test(code)) {
      return simplify
        ? 'It packages a set of actions so they can be used again whenever needed.'
        : 'This code defines a function that receives input and produces a result.'
    }
    return simplify
      ? 'It works through some information from top to bottom, then saves or displays the result.'
      : 'This code reads data, processes it in order, and then returns or displays a result.'
  }
  if (/\.filter\s*\(/.test(code) && /\.map\s*\(/.test(code)) {
    return simplify
      ? '它先从一组东西里挑出符合条件的，再拿出我们真正需要的信息。'
      : '这段代码先筛选一组数据，再把保留下来的项目转换成需要的结果。'
  }
  if (/\bfetch\s*\(/.test(code)) {
    return simplify
      ? '它去另一个网站取回信息，确认成功后再拿出结果。'
      : '这段代码向接口发起异步请求，检查响应状态，并返回解析后的数据。'
  }
  if (/\binterface\s+\w+/.test(code)) {
    return simplify
      ? '它先写下“用户资料应该长什么样”，然后用这些资料生成一句话。'
      : '这段 TypeScript 代码定义数据形状，再通过带类型的函数生成结果。'
  }
  if (/\[[^\]]+\bfor\b[^\]]+\bif\b[^\]]*\]/s.test(code)) {
    return simplify
      ? '它查看列表里的每一项，只把符合要求的放进新列表。'
      : '这段代码用列表推导式筛选原列表，得到一个符合条件的新列表。'
  }
  if (/\bfor\b[\s\S]*\bif\b/.test(code)) {
    return simplify
      ? '它把一组内容逐个看一遍，把符合条件的内容收集起来。'
      : '这段代码遍历一组数据，通过条件判断挑出符合要求的项目。'
  }
  if (/\b(function|def)\s+\w+/.test(code)) {
    return simplify
      ? '它把一套可以重复使用的操作打包起来，需要时就能调用。'
      : '这段代码定义了一个函数，用来接收输入并产生对应结果。'
  }
  return simplify
    ? '它按从上到下的顺序处理信息，并把结果保存或显示出来。'
    : '这段代码读取一些数据，按顺序进行处理，然后得到或展示结果。'
}

function describeBlock(block: CodeBlock, request: ExplainRequest, index: number): Omit<ExplanationStep, 'id'> {
  const code = block.code
  const simple = Boolean(request.simplify) || request.depth === 'beginner'
  const en = request.locale === 'en'
  let title = en ? `Process part ${index + 1}` : `处理第 ${index + 1} 部分`
  let explanation = en
    ? (simple ? 'The program completes one small job here.' : 'This block completes one logical step in the program.')
    : (simple ? '程序走到这里，会完成一小步工作。' : '这部分完成代码流程中的一个逻辑步骤。')
  let concepts: string[] = []

  if (/\b(interface|type)\s+/.test(code)) {
    title = en ? 'Describe the shape of the data' : '约定数据的样子'
    explanation = en
      ? (simple ? 'Think of this as a blank form: it says a name must be text and an age must be a number.' : 'The interface lists the fields an object needs and the data type allowed in each field.')
      : (simple ? '这里像填写一张空白资料卡：先规定姓名要写文字、年龄要写数字。' : '接口先描述对象需要有哪些字段，以及每个字段允许使用的数据类型。')
    concepts = en ? ['interface', 'type'] : ['接口', '类型']
  } else if (/\b(async\s+)?function\b|^\s*def\s+/m.test(code)) {
    title = en ? 'Define a reusable set of actions' : '定义一套可重复的操作'
    explanation = en
      ? (simple ? 'This gives a group of actions a name, so the program can use those actions again later.' : 'This declares a function, accepts parameters, and packages the following logic for reuse.')
      : (simple ? '这里给一组操作起了名字，以后只要叫这个名字，就能重复做这些事。' : '这里声明函数、接收参数，并把后续代码包装成可重复调用的逻辑。')
    concepts = en ? ['function', ...(code.includes('async') ? ['async'] : [])] : ['函数', ...(code.includes('async') ? ['异步'] : [])]
  } else if (/\bfetch\s*\(|\bawait\b/.test(code)) {
    title = en ? 'Wait for outside data' : '等待外部数据回来'
    explanation = en
      ? (simple ? 'The program sends a request, waits for a reply, and only then continues.' : 'The code starts a network request; `await` pauses this function until the asynchronous task finishes.')
      : (simple ? '程序发出请求后先等一等，收到回复才继续往下走。' : '代码发起网络请求；`await` 会在这个异步任务完成后再继续当前函数。')
    concepts = en ? ['async', 'await', 'network request'] : ['异步', 'await', '网络请求']
  } else if (/\.filter\s*\(|\bif\b/.test(code)) {
    title = en ? 'Check a condition and choose' : '检查条件并作出选择'
    explanation = en
      ? (simple ? 'Like a sieve, the program checks each item and lets only matching items through.' : 'The condition becomes true or false, and the program uses that result to keep data or choose a branch.')
      : (simple ? '程序像过筛子一样检查条件，只让合格的内容通过。' : '条件表达式会得到“是”或“否”，程序据此决定保留数据或执行分支。')
    concepts = [code.includes('.filter') ? 'filter' : (en ? 'condition' : '条件判断')]
  } else if (/\.map\s*\(/.test(code)) {
    title = en ? 'Transform every item' : '把每一项换成新样子'
    explanation = en
      ? (simple ? 'The program picks up each remaining item and keeps the part needed next.' : '`map` transforms every array item and returns a new array of the same length.')
      : (simple ? '程序逐个拿起保留下来的内容，只取出下一步需要的部分。' : '`map` 会对数组中的每一项执行转换，并返回一个长度相同的新数组。')
    concepts = en ? ['map', 'arrow function'] : ['map', '箭头函数']
  } else if (/\bfor\b|\.forEach\s*\(/.test(code)) {
    title = en ? 'Look at each item' : '逐个查看数据'
    explanation = en
      ? (simple ? 'The program goes through a group from start to finish, taking one item at a time.' : 'The loop takes each collection item in turn and repeats the indented or callback operation.')
      : (simple ? '程序把一组内容从头到尾看一遍，每次拿出一项。' : '循环依次取出集合中的每一项，并重复执行缩进或回调中的操作。')
    concepts = [en ? 'loop' : '循环']
  } else if (/\b(return|print|console\.log)\b/.test(code)) {
    title = code.includes('return') ? (en ? 'Hand back the result' : '交回处理结果') : (en ? 'Display the result' : '显示最后结果')
    explanation = code.includes('return')
      ? (en ? (simple ? 'This hands the finished result back to the place that asked for it.' : '`return` ends the function and sends a value back to the caller.') : (simple ? '这里把做好的结果交回给调用它的地方。' : '`return` 结束函数，并把结果交回调用处。'))
      : (en ? (simple ? 'This shows the result so a person can see it.' : 'The output statement displays the current result in the console.') : (simple ? '这里把结果显示出来，方便人查看。' : '输出语句把当前结果显示在控制台中。'))
    concepts = [code.includes('return') ? (en ? 'return value' : '返回值') : (en ? 'output' : '输出')]
  } else if (/\b(const|let|var)\b|\w+\s*=/.test(code)) {
    title = en ? 'Prepare and save data' : '准备并保存数据'
    explanation = en
      ? (simple ? 'This puts a name on some data, so the program can find it again later.' : 'The code creates variables and keeps raw data or calculated results in memory for later use.')
      : (simple ? '这里给数据贴上名字，后面就能用这个名字找到它。' : '代码创建变量，把原始数据或计算结果保存在内存中供后续使用。')
    concepts = [en ? 'variable' : '变量']
  }

  const detailByDepth = {
    beginner: en ? `Think of lines ${block.start}–${block.end} as one recipe step: notice what goes in and what comes out.` : `把第 ${block.start}–${block.end} 行想成食谱里的一个动作：先确认它拿到了什么，再看它留下了什么。`,
    intro: en ? `For lines ${block.start}–${block.end}, identify the input, operation, and output. Variable names often reveal the meaning.` : `关注第 ${block.start}–${block.end} 行的输入、操作和输出；变量名通常能提示数据的含义。`,
    advanced: en ? `Lines ${block.start}–${block.end} form one logical unit. Watch its scope, return value, and failure paths.` : `第 ${block.start}–${block.end} 行构成一个逻辑单元。继续阅读时可留意作用域、返回值与失败路径。`,
  }

  return {
    title,
    explanation,
    detail: simple ? (en ? 'Don’t memorize the syntax yet—just follow how the data changes.' : '先不用记语法，只要跟住“数据发生了什么变化”。') : detailByDepth[request.depth],
    lineStart: block.start,
    lineEnd: block.end,
    concepts,
  }
}

function collectConcepts(code: string, depth: ExplainRequest['depth'], locale: ExplainRequest['locale']): Concept[] {
  const en = locale === 'en'
  const definitions: Array<[RegExp, Concept]> = [
    [/\b(const|let|var)\b|\w+\s*=/, { name: en ? 'Variable' : '变量', explanation: en ? 'A name attached to data so the program can use it again later.' : '给一份数据起名字，方便程序稍后再次使用。' }],
    [/\bfor\b|\.forEach\s*\(/, { name: en ? 'Loop' : '循环', explanation: en ? 'Repeats the same operation for multiple items.' : '让同一组操作对多项数据重复执行。' }],
    [/\bif\b|\.filter\s*\(/, { name: en ? 'Condition' : '条件判断', explanation: en ? 'Chooses what happens next based on whether a check is true or false.' : '根据一个条件是真还是假，决定接下来怎么做。' }],
    [/\b(function|def)\b|=>/, { name: en ? 'Function' : '函数', explanation: en ? 'A named, reusable group of operations.' : '一组被命名、可重复调用的操作。' }],
    [/\basync\b|\bawait\b/, { name: en ? 'Asynchronous work' : '异步', explanation: en ? 'Lets a time-consuming task wait for its result without freezing all other work.' : '耗时任务可以等待结果，而不必让整个程序停住。' }],
    [/\binterface\b|:\s*(string|number|boolean)/, { name: en ? 'Type' : '类型', explanation: en ? 'Describes the allowed shape of data and helps catch mismatches early.' : '说明一份数据允许是什么形状，帮助提前发现用错数据的问题。' }],
    [/\.map\s*\(/, { name: 'map', explanation: en ? 'Transforms each array item and collects the results in a new array.' : '逐项转换数组，并把转换后的内容组成一个新数组。' }],
    [/\.filter\s*\(/, { name: 'filter', explanation: en ? 'Checks array items and returns a new array containing only matches.' : '根据条件筛选数组，并返回只含合格项目的新数组。' }],
    [/\[[^\]]+\bfor\b[^\]]*\]/s, { name: en ? 'List comprehension' : '列表推导式', explanation: en ? 'A compact Python form that can transform and filter while creating a list.' : 'Python 中创建新列表的一种紧凑写法，可以同时转换和筛选。' }],
    [/\breturn\b/, { name: en ? 'Return value' : '返回值', explanation: en ? 'The result a function hands back when it finishes.' : '函数完成后交回给调用者的结果。' }],
  ]
  const limit = depth === 'beginner' ? 5 : depth === 'intro' ? 8 : 12
  return definitions.filter(([pattern]) => pattern.test(code)).map(([, concept]) => concept).slice(0, limit)
}

function findLine(code: string, pattern: RegExp): number | undefined {
  const index = code.split('\n').findIndex((item) => pattern.test(item))
  return index >= 0 ? index + 1 : undefined
}

function collectWarnings(code: string, locale: ExplainRequest['locale']): ExplanationWarning[] {
  const en = locale === 'en'
  const warnings: ExplanationWarning[] = []
  if (/\bfetch\s*\(/.test(code) && !/\btry\b[\s\S]*\bcatch\b/.test(code)) {
    const lineStart = findLine(code, /fetch\s*\(/)
    warnings.push({
      title: en ? 'Network requests can fail' : '网络请求可能失败',
      detail: en ? 'This code does not catch offline or timeout errors. Real apps usually use try/catch and show a helpful message.' : '这段代码没有捕获断网、超时等异常；实际项目通常会用 try/catch，并给用户失败提示。',
      severity: 'caution',
      lineStart,
      lineEnd: lineStart,
    })
  }
  if (/\[[^\]]+\]/.test(code) && /\[[a-zA-Z_$][\w$]*\]/.test(code)) {
    warnings.push({
      title: en ? 'An index may be out of range' : '索引可能超出范围',
      detail: en ? 'If that position does not exist, the result may be undefined or an error. Check the range before reading it.' : '如果位置不存在，结果可能是 undefined 或抛出错误，取值前最好确认范围。',
      severity: 'caution',
    })
  }
  if (/\s\/\s/.test(code)) {
    warnings.push({
      title: en ? 'Watch for division by zero' : '留意除数为零',
      detail: en ? 'When the divisor comes from outside input, check that it is not zero first.' : '当除数来自外部输入时，应先确认它不是 0。',
      severity: 'note',
    })
  }
  if (!warnings.length) {
    warnings.push({
      title: en ? 'An explanation is not a runtime result' : '解释不等于运行结果',
      detail: en ? 'This is static reading; the code was not run. Actual behavior still depends on inputs and the runtime environment.' : '这里做的是静态阅读，没有执行代码。真实结果仍会受到输入数据和运行环境影响。',
      severity: 'note',
    })
  }
  return warnings
}

function buildFlow(code: string, simplify: boolean, locale: ExplainRequest['locale']): string[] {
  const en = locale === 'en'
  const flow = [en ? (simplify ? 'First, prepare the things to work with' : 'Prepare the input data and variables') : (simplify ? '先准备要处理的内容' : '准备输入数据与需要使用的变量')]
  if (/\bfor\b|\.filter\s*\(|\.map\s*\(/.test(code)) {
    flow.push(en ? (simplify ? 'Then check each item and keep or change it' : 'Loop through the data to filter, test, or transform it') : (simplify ? '再逐个查看，并按条件挑选或改变' : '遍历数据，并进行筛选、判断或转换'))
  }
  if (/\bfetch\s*\(/.test(code)) {
    flow.push(en ? (simplify ? 'Wait for outside information to come back' : 'Wait for the network response and check its status') : (simplify ? '等待外部信息送回来' : '等待网络响应并检查请求状态'))
  }
  if (/\b(return|print|console\.log)\b/.test(code)) {
    flow.push(en ? (simplify ? 'Finally, hand back or show the result' : 'Return or display the processed result') : (simplify ? '最后交回或显示结果' : '返回或输出处理后的结果'))
  } else {
    flow.push(en ? (simplify ? 'Finally, get the finished result' : 'Finish processing and keep the result') : (simplify ? '最后得到处理结果' : '完成处理并保留结果'))
  }
  return flow
}

export const mockProvider: ExplanationProvider = {
  mode: 'demo',
  async explain(request, signal) {
    await wait(650, signal)
    const blocks = splitBlocks(request.code)
    const summary = getPurpose(request.code, Boolean(request.simplify) || request.depth === 'beginner', request.locale)
    const en = request.locale === 'en'
    const result: ExplanationResult = {
      summary,
      flow: buildFlow(request.code, Boolean(request.simplify) || request.depth === 'beginner', request.locale),
      steps: blocks.map((block, index) => ({
        id: `step-${index + 1}`,
        ...describeBlock(block, request, index),
      })),
      concepts: collectConcepts(request.code, request.depth, request.locale),
      warnings: collectWarnings(request.code, request.locale),
      quiz: {
        question: en ? 'What is the main goal of this code?' : '这段代码最主要想完成什么？',
        options: [
          summary,
          en ? 'Delete every file on the computer' : '删除电脑中的所有文件',
          en ? 'Change the rules of the programming language' : '改变编程语言的语法规则',
        ],
        answer: 0,
        explanation: en ? 'The answer is in the short overview. If you can say it again in your own words, you have the main idea.' : '答案就在“一句话概览”里。能用自己的话再说一遍，就说明你抓住了主线。',
      },
      meta: {
        provider: 'demo',
        generatedAt: new Date().toISOString(),
        disclaimer: en ? 'This teaching explanation was generated by local demo rules, not a live AI, and your code was not run.' : '这是本地 Demo 规则生成的教学解释，不是 AI 结论，也没有执行你的代码。',
      },
    }
    return result
  },
}
