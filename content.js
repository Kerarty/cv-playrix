/* ============================================================================
   КОНТЕНТ резюме. Весь текст — и русский, и английский — живёт здесь.
   Код его не дублирует: правишь этот файл, страница меняется.
   ---------------------------------------------------------------------------
   Ключи обращаются как CONTENT.ru.hero.title, в разметке — data-i18n="hero.title".
   Числа, которые меняются от прогона к прогону, помечены шаблоном {{...}}.
   ========================================================================== */

var CONTENT = {
  /* --------------------------------------------------------------------------
     РУССКИЙ
     -------------------------------------------------------------------------- */
  ru: {
    langButton: "EN",
    htmlLang: "ru",
    role: "геймдизайнер плейблов",

    meta: {
      title: "Ярослав Кукар — геймдизайнер плейблов",
      description:
        "Интерактивное резюме на три механики: merge-3, тайминг, порядок. " +
        "Начинающий геймдизайнер с профильным техническим образованием. " +
        "Отклик на вакансию Game Designer — Playables (Intern) в Playrix.",
    },

    nav: {
      cv: "Резюме текстом",
      edu: "Вуз",
      field: "Специальность",
      degree: "Степень",
      years: "Годы",
      case1: "Случай 1: сетка со слиянием",
      case2: "Случай 2: попадание по времени",
      case3: "Случай 3: порядок действий",
    },

    hero: {
      kicker: "Отклик на вакансию Game Designer — Playables (Intern) · Playrix",
      title: "Делаю креативы, в которые хочется играть до конца",
      sub:
        "Это не список достижений — это три механики, в которые можно сразу " +
        "влезть пальцем. Под каждой — разбор, почему она сделана именно так, " +
        "и проект, который за ней стоит.",
    },

    cases: {
      merge: {
        tag: "Читаемость",
        title: "Правило видно раньше, чем его успели объяснить",
        text:
          "Игрок разбирается в сетке за пару секунд: фигуры разного цвета и " +
          "формы, свайп вместо инструкции. Ровно так же устроен мой GDD — " +
          "каждая механика описана так, что её можно сразу отдать в разработку.",
        evidence: "Проект 1 · Концепт-документ",
      },
      timing: {
        tag: "Удержание",
        title: "Пятнадцать секунд, за которые нужно успеть зацепить",
        text:
          "Темп нарастает, награда за точное попадание, промах не наказывает — " +
          "только не даёт залипнуть на одном и том же. Так же крутился баланс " +
          "в «Королевствах Эридора»: гипотеза, изменение, плейтест, вывод.",
        evidence: "Проект 2 · Варгейм на 4 фракции",
      },
      order: {
        tag: "Подача",
        title: "Объяснить правило, не написав ни слова",
        text:
          "Очередь считывается с самих блоков — ни подсказок, ни туториала. " +
          "Так же собраны локации и производственные цепочки в Unity-проекте: " +
          "что делать дальше, игрок понимает из сцены.",
        evidence: "Проект 3 · Unity-проект",
      },
    },

    games: {
      merge: {
        score: "Очки",
        best: "Лучшая",
        prompt: "Свайпни фигуру в соседнюю клетку — три в ряд сольются",
      },
      timing: {
        score: "Очки",
        round: "Раунд",
        prompt: "Тапни, когда стрелка в золотой зоне",
      },
      order: {
        score: "Очки",
        step: "Шаг",
        prompt: "Разбирай кирпичи по порядку, начиная с 1",
      },
    },

    install: {
      title: "Креатив отработал",
      text: "Посмотрел, поиграл, добери сам — это и есть моя работа на стажировке.",
      primary: "Написать Ярославу",
      secondary: "Скачать резюме (PDF)",
      again: "Ещё раз",
    },

    contacts: {
      title: "Давайте познакомимся",
      sub: "Готов к любому формату: звонок, созвон, тестовое прямо из переписки.",
      telegram: "Telegram",
      email: "Почта",
      phone: "Телефон",
      github: "GitHub",
    },

    about: {
      heading: "Обо мне",
      lead:
        "Начинающий геймдизайнер с профильным техническим образованием в игровой " +
        "индустрии. Понимаю, как механика превращается в реализацию, и проверяю " +
        "гипотезы замерами, а не мнением.",
      body:
        "Коммерческого опыта в геймдизайне пока нет — и это честно. Зато есть " +
        "привычка доводить: три законченных проекта, из них один с пятнадцатью " +
        "плейтест-сессиями и итеративной балансировкой по итогам каждой. " +
        "Ищу команду, где нужно придумывать механики и смотреть, как они " +
        "работают на живых людях.",
    },

    skills: {
      heading: "Навыки",
      groups: [
        {
          name: "Геймдизайн",
          items: [
            "Проектирование механик и прогрессии",
            "Баланс: математика, теория вероятностей, статистика",
            "Левел-дизайн и сценарная структура",
            "Документация: GDD под передачу в разработку",
          ],
        },
        {
          name: "Реализация",
          items: [
            "Unity — базово",
            "C#, C++, JavaScript",
            "SQL, работа с данными",
            "Excel / Google Sheets",
          ],
        },
        {
          name: "Визуал и продакшн",
          items: [
            "Композиция, цвет, ритм кадра",
            "Adobe Photoshop",
            "Figma",
            "Сборка прототипов под веб",
          ],
        },
      ],
    },

    decision: {
      heading: "Как я принимаю решения",
      lead:
        "Каждое число в проекте имеет причину, и она записана рядом с ним — " +
        "чтобы через полгода можно было вспомнить, что именно проверялось.",
      rules: [
        {
          t: "Одно изменение — одно наблюдение",
          d: "Правлю две вещи разом и не пойму, что сработало. Это медленнее, зато вывод не врёт.",
        },
        {
          t: "Сначала дёшево",
          d: "Бумага и прототип до того, как что-то полируется. Дорогую работу не начинаю, пока не знаю, что идея вообще работает.",
        },
        {
          t: "Глаз не считается проверкой",
          d: "«Мне кажется, так лучше» — не аргумент. Аргумент — замер и разница до и после.",
        },
      ],
      exampleTitle: "Пример из прототипа",
      exampleBody:
        "В башенном прототипе башня крутилась со скоростью 63°/s. Играть было " +
        "неудобно: курс менялся быстрее, чем игрок успевал оценить, куда встала " +
        "машина. Снизил до 40°/s — разворот читается, но с весом. Одно число, " +
        "одно наблюдение, один комментарий в коде.",
    },

    spec: {
      heading: "Технические детали креатива",
      lead:
        "Эта страница сделана по правилам, которые предъявляют к плейблам: " +
        "открывается с телефона, играется пальцем, ничего не просит установить.",
      rows: [
        { k: "Формат", v: "Портрет 9:16, от 320 px, тач и мышь" },
        { k: "Зависимости", v: "Ноль. Ни одного CDN — у рекрутера не должен отваливаться интернет" },
        { k: "Открытие", v: "Двойным кликом с диска и с любого статик-хостинга" },
        { k: "Совместимость", v: "Свежие Chrome, Safari, Firefox, Edge, мобильные браузеры" },
        { k: "Доступность", v: "Клавиатура на десктопе, prefers-reduced-motion, контраст текста" },
        { k: "Печать", v: "Ctrl+P печатает текстовое резюме в одну страницу A4" },
      ],
      specTitle: "Замеры этой сборки",
      specNote:
        "Значения сняты в этой сборке, а не взяты из документации. " +
        "Проверено на свежем Chrome.",
      metrics: [
        { k: "Размер", v: "{{size}}", note: "пять файлов, без сжатия" },
        { k: "До первого кадра", v: "{{ttf}}", note: "от открытия страницы" },
        { k: "Число запросов", v: "0", note: "после загрузки файлов" },
      ],
      nextTitle: "Что бы я тестировал дальше",
      next: [
        "Три варианта первых трёх секунд: авто-игра, инструкция, интрига",
        "Где воронка теряет игрока — по времени до первого касания",
        "Пятнадцать секунд против тридцати: где окупается длинная версия",
        "Метрика — CPI и CTR креатива, а не «просто интересно»",
      ],
    },

    projects: {
      heading: "Проекты",
      items: [
        {
          n: "01",
          title: "Концепт-документ компьютерной игры",
          kind: "GDD · стратегия с элементами градостроительного симулятора",
          text:
            "Описал игровые механики, прогрессию, баланс ресурсов и арт-стиль. " +
            "Документ структурирован под передачу в команду разработки: " +
            "разделы идут в том порядке, в котором их читают.",
          facts: ["Механики и прогрессия", "Баланс ресурсов", "Арт-стиль"],
        },
        {
          n: "02",
          title: "«Королевства Эридора» — настольная тактика",
          kind: "Варгейм · пошаговая стратегия на 4 фракции",
          text:
            "Спроектировал с нуля: боевые механики, захват территорий, баланс " +
            "юнитов. Провёл 15+ плейтест-сессий, собирал обратную связь и " +
            "итеративно правил характеристики — по тому же циклу, что и разбор " +
            "события после релиза.",
          facts: ["4 фракции", "15+ плейтестов", "Итеративный баланс"],
        },
        {
          n: "03",
          title: "Unity-проект с производственными механиками",
          kind: "Собственная разработка · Unity",
          text:
            "Система заказов, производственные цепочки и несколько игровых " +
            "локаций, где игрок считывает следующее действие из сцены. " +
            "Дополнительно — небольшой браузерный игровой прототип.",
          facts: ["Система заказов", "Производственные цепочки", "Несколько локаций"],
        },
      ],
    },

    education: {
      heading: "Образование",
      degree: "Белорусский государственный университет информатики и радиоэлектроники",
      field: "Информационные системы и технологии в игровой индустрии",
      degreeShort: "Бакалавр, инженер-программист",
      years: "2023 — 2027",
      langs: [
        { name: "Русский", level: "родной" },
        { name: "Английский", level: "A2, продолжаю" },
      ],
    },

    footer: {
      note: "Сделано без фреймворков и сборки — весь код в трёх файлах.",
      print: "Сохранить в PDF",
      backToTop: "Наверх",
    },
  },

  /* --------------------------------------------------------------------------
     ENGLISH
     -------------------------------------------------------------------------- */
  en: {
    langButton: "RU",
    htmlLang: "en",
    role: "playables game designer",

    meta: {
      title: "Yaroslav Kukar — playables game designer",
      description:
        "An interactive resume built on three mechanics: merge-3, timing and " +
        "ordering. Junior game designer with a technical degree in game " +
        "development, applying for Playables Game Designer (Intern) at Playrix.",
    },

    nav: {
      cv: "Résumé as text",
      edu: "University",
      field: "Field",
      degree: "Degree",
      years: "Years",
      case1: "Case 1: a merging grid",
      case2: "Case 2: timing a hit",
      case3: "Case 3: order of action",
    },

    hero: {
      kicker: "Applying for Playables Game Designer (Intern) · Playrix",
      title: "I make creatives people want to finish",
      sub:
        "This is not a list of achievements — it is three mechanics you can " +
        "play with a finger right away. Under each one: why it is built that " +
        "way, and the project behind it.",
    },

    cases: {
      merge: {
        tag: "Readability",
        title: "The rule lands before anyone explains it",
        text:
          "Players read the board in a couple of seconds: shapes and colours " +
          "differ, and a swipe needs no instruction. My GDD works the same way " +
          "— every mechanic is written so a developer can pick it up as is.",
        evidence: "Project 1 · Game design document",
      },
      timing: {
        tag: "Retention",
        title: "Fifteen seconds to hook someone",
        text:
          "The tempo rises, a clean hit pays out, a miss never punishes — it " +
          "just stops you from drifting. I balanced Kings of Eridor the same " +
          "way: hypothesis, change, playtest, conclusion.",
        evidence: "Project 2 · Four-faction wargame",
      },
      order: {
        tag: "Presentation",
        title: "Explain the rule without a single word",
        text:
          "The order is read off the blocks themselves — no hints, no tutorial. " +
          "The Unity project is built the same way: locations and production " +
          "chains that tell the player what to do next.",
        evidence: "Project 3 · Unity project",
      },
    },

    games: {
      merge: {
        score: "Score",
        best: "Best",
        prompt: "Swipe a tile into a neighbour — three in a row merge",
      },
      timing: {
        score: "Score",
        round: "Round",
        prompt: "Tap while the needle sits in the gold zone",
      },
      order: {
        score: "Score",
        step: "Step",
        prompt: "Break the bricks in order, starting at 1",
      },
    },

    install: {
      title: "Creative done its job",
      text: "You watched, you played, you finished it — that is the job itself.",
      primary: "Message Yaroslav",
      secondary: "Download résumé (PDF)",
      again: "Play again",
    },

    contacts: {
      title: "Let us talk",
      sub: "Happy with any format: a call, a video chat, or a test straight in chat.",
      telegram: "Telegram",
      email: "Email",
      phone: "Phone",
      github: "GitHub",
    },

    about: {
      heading: "About me",
      lead:
        "Junior game designer with a technical degree in game development. I " +
        "understand how a mechanic turns into an implementation, and I test " +
        "hypotheses with numbers rather than opinions.",
      body:
        "I have no commercial game design experience yet, and I would rather " +
        "say so plainly. What I do have is a habit of finishing things: three " +
        "completed projects, one of them with fifteen playtest sessions and " +
        "iteration based on each of them. I am looking for a team where I get " +
        "to design mechanics and watch how they behave on real people.",
    },

    skills: {
      heading: "Skills",
      groups: [
        {
          name: "Game design",
          items: [
            "Mechanic and progression design",
            "Balance: maths, probability, statistics",
            "Level design and scene structure",
            "Documentation: GDDs written for a dev team",
          ],
        },
        {
          name: "Implementation",
          items: [
            "Unity — basics",
            "C#, C++, JavaScript",
            "SQL, working with data",
            "Excel / Google Sheets",
          ],
        },
        {
          name: "Visual and production",
          items: [
            "Composition, colour, frame rhythm",
            "Adobe Photoshop",
            "Figma",
            "Prototyping for the web",
          ],
        },
      ],
    },

    decision: {
      heading: "How I make decisions",
      lead:
        "Every number in a project has a reason, and the reason is written " +
        "next to it — so that in six months you can still recall what was " +
        "actually being tested.",
      rules: [
        {
          t: "One change, one observation",
          d: "Fix two things at once and you cannot tell which one worked. Slower, but the conclusion does not lie.",
        },
        {
          t: "Cheap first",
          d: "Paper and a prototype before anything gets polished. I do not start expensive work until I know the idea works.",
        },
        {
          t: "Looking is not testing",
          d: "“I think it feels better” is not an argument. A measurement is.",
        },
      ],
      exampleTitle: "Example from a prototype",
      exampleBody:
        "In a tower prototype the turret traversed at 63°/s. It was awkward " +
        "to play: the heading changed faster than the player could read where " +
        "the tank had settled. I brought it down to 40°/s — the turn reads " +
        "clearly but still has weight. One number, one observation, one comment " +
        "in the code.",
    },

    spec: {
      heading: "Technical details",
      lead:
        "This page follows the rules we hold playables to: it opens on a " +
        "phone, plays with a thumb, and asks for no installation.",
      rows: [
        { k: "Format", v: "Portrait 9:16, from 320 px, touch and mouse" },
        { k: "Dependencies", v: "None. Not a single CDN" },
        { k: "Opening", v: "Double-click from disk, or any static host" },
        { k: "Compatibility", v: "Current Chrome, Safari, Firefox, Edge, mobile browsers" },
        { k: "Accessibility", v: "Keyboard on desktop, prefers-reduced-motion, text contrast" },
        { k: "Print", v: "Ctrl+P prints the text résumé as a single A4 page" },
      ],
      specTitle: "Measured on this build",
      specNote: "Taken from this build, not from documentation.",
      metrics: [
        { k: "Size", v: "{{size}}", note: "five files, uncompressed" },
        { k: "First frame", v: "{{ttf}}", note: "from page open" },
        { k: "Requests after load", v: "0", note: "once files are in" },
      ],
      nextTitle: "What I would test next",
      next: [
        "Three versions of the first three seconds: autoplay, instruction, intrigue",
        "Where the funnel drops people — time to first touch",
        "Fifteen seconds against thirty: where the long version pays off",
        "The metric is CPI and CTR, not “that looked interesting”",
      ],
    },

    projects: {
      heading: "Projects",
      items: [
        {
          n: "01",
          title: "Game design document",
          kind: "GDD · strategy with city-building elements",
          text:
            "Designed the mechanics, progression, resource balance and art " +
            "direction. The document is structured for handover to a dev team: " +
            "sections run in the order they are read.",
          facts: ["Mechanics and progression", "Resource balance", "Art direction"],
        },
        {
          n: "02",
          title: "“Kings of Eridor” — tabletop tactics",
          kind: "Wargame · turn-based strategy, four factions",
          text:
            "Designed from scratch: combat mechanics, territory capture, unit " +
            "balance. Ran 15+ playtest sessions, collected feedback and " +
            "iterated on the numbers — on the same cycle as a post-launch " +
            "event review.",
          facts: ["4 factions", "15+ playtests", "Iterative balancing"],
        },
        {
          n: "03",
          title: "Unity project with production mechanics",
          kind: "Own project · Unity",
          text:
            "An order system, production chains and several locations where " +
            "the player reads the next action off the scene itself. Plus a " +
            "small browser game prototype.",
          facts: ["Order system", "Production chains", "Several locations"],
        },
      ],
    },

    education: {
      heading: "Education",
      degree: "Belarusian State University of Informatics and Radioelectronics",
      field: "Information systems and technologies in the game industry",
      degreeShort: "Bachelor, software engineer",
      years: "2023 — 2027",
      langs: [
        { name: "Russian", level: "native" },
        { name: "English", level: "A2, in progress" },
      ],
    },

    footer: {
      note: "Built with no frameworks and no build step — three files in total.",
      print: "Save as PDF",
      backToTop: "Back to top",
    },
  },
};

/* Метрики вида {{size}} и {{ttf}} подставляет main.js: это не выдуманные
   цифры, а реальный размер файлов и реальное время до первого кадра. */
