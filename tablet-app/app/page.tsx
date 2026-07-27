"use client";

import { useEffect, useMemo, useState } from "react";

type Screen = "home" | "lesson" | "parent" | "report";
type Lesson = {
  id: number;
  week: number;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  skill: string;
  activities: Activity[];
};
type Activity = {
  prompt: string;
  instruction: string;
  options: { label: string; emoji?: string }[];
  answer: number;
  hint: string;
  explain: string;
};
type Progress = {
  completed: number[];
  stars: number;
  attempts: Record<number, number>;
};

const LESSONS: Lesson[] = [
  {
    id: 1, week: 1, title: "分类侦探", subtitle: "找到住在一起的伙伴", icon: "🧺",
    color: "#ff8f70", skill: "分类与表达",
    activities: [
      { prompt: "谁应该住进红色小屋？", instruction: "仔细看颜色，点一下你的答案", options: [{label:"红苹果",emoji:"🍎"},{label:"蓝雨伞",emoji:"☂️"},{label:"黄香蕉",emoji:"🍌"}], answer: 0, hint: "先不看它是什么，只看颜色。", explain: "苹果是红色的，所以它住进红色小屋。" },
      { prompt: "谁和另外三个不是一组？", instruction: "找出唯一不同的一个", options: [{label:"圆饼干",emoji:"🍪"},{label:"圆皮球",emoji:"⚽"},{label:"圆橙子",emoji:"🍊"},{label:"方礼物",emoji:"🎁"}], answer: 3, hint: "看看外面的轮廓：圆圆的，还是有角？", explain: "礼物盒有四个角，另外三个看起来都是圆的。" },
      { prompt: "换一种规则，谁能和香蕉一组？", instruction: "这一次按“能吃”来分", options: [{label:"草莓",emoji:"🍓"},{label:"小汽车",emoji:"🚗"},{label:"帽子",emoji:"🧢"}], answer: 0, hint: "想一想：哪一个也可以放进嘴巴吃？", explain: "香蕉和草莓都是食物。同一批东西可以用不同规则分类。" },
    ],
  },
  {
    id: 2, week: 1, title: "换副眼镜", subtitle: "规则变了，分法也变", icon: "👓",
    color: "#f4b64a", skill: "规则切换",
    activities: [
      { prompt: "戴上颜色眼镜：选出蓝色的", instruction: "现在只看颜色", options: [{label:"蓝圆形",emoji:"🔵"},{label:"红圆形",emoji:"🔴"},{label:"黄星星",emoji:"⭐"}], answer: 0, hint: "规则卡上画的是蓝色。", explain: "蓝圆形符合颜色规则。" },
      { prompt: "眼镜换了：选出圆形的", instruction: "颜色不重要，现在只看形状", options: [{label:"蓝方块",emoji:"🟦"},{label:"红圆形",emoji:"🔴"},{label:"黄星星",emoji:"⭐"}], answer: 1, hint: "别被刚才的蓝色规则骗到。找圆圆的。", explain: "规则已经从颜色换成形状，所以红圆形正确。" },
      { prompt: "同时满足两个条件的是谁？", instruction: "它既要是红色，又要是圆形", options: [{label:"红圆形",emoji:"🔴"},{label:"红方块",emoji:"🟥"},{label:"蓝圆形",emoji:"🔵"}], answer: 0, hint: "先找红色，再在红色里面找圆形。", explain: "红圆形同时满足两条线索。" },
    ],
  },
  {
    id: 3, week: 1, title: "谁走错了", subtitle: "找出不属于的一位", icon: "🕵️",
    color: "#8678d8", skill: "集合与排除",
    activities: [
      { prompt: "动物队伍里混进了谁？", instruction: "找出不是动物的一个", options: [{label:"小狗",emoji:"🐶"},{label:"小猫",emoji:"🐱"},{label:"火车",emoji:"🚂"},{label:"小兔",emoji:"🐰"}], answer: 2, hint: "哪一个不会吃东西、也不会自己长大？", explain: "火车不是动物。" },
      { prompt: "会飞的队伍里谁走错了？", instruction: "想一想它们平常怎样移动", options: [{label:"小鸟",emoji:"🐦"},{label:"蝴蝶",emoji:"🦋"},{label:"小鱼",emoji:"🐟"},{label:"蜜蜂",emoji:"🐝"}], answer: 2, hint: "谁住在水里，用鳍游泳？", explain: "小鱼会游泳，另外三个都会飞。" },
      { prompt: "哪一个理由最完整？", instruction: "为“鱼不属于飞行队”选择理由", options: [{label:"因为它是蓝色的"},{label:"因为它生活在水里，用鳍游泳"},{label:"因为我不喜欢鱼"}], answer: 1, hint: "好理由要说出能观察和验证的特点。", explain: "分类理由要与规则有关，也要能被别人检查。" },
    ],
  },
  {
    id: 4, week: 2, title: "规律火车", subtitle: "发现一直重复的小秘密", icon: "🚂",
    color: "#56b89f", skill: "AB重复模式",
    activities: [
      { prompt: "红、蓝、红、蓝，下一节是什么？", instruction: "找到一直重复的两个一组", options: [{label:"红色",emoji:"🔴"},{label:"蓝色",emoji:"🔵"},{label:"黄色",emoji:"🟡"}], answer: 0, hint: "把它们两个两个圈起来：红蓝｜红蓝｜？", explain: "重复的小单元是“红、蓝”，所以下一个从红开始。" },
      { prompt: "大、小、小、大、小、小，接下来呢？", instruction: "这次重复单元有三个位置", options: [{label:"大",emoji:"●"},{label:"小",emoji:"•"},{label:"两个大"}], answer: 0, hint: "试着分组：大、小、小｜大、小、小｜？", explain: "重复单元是“大、小、小”，接下来又是大。" },
      { prompt: "哪一列和“拍手、跺脚”规律一样？", instruction: "材料变了，但规律可以相同", options: [{label:"圆、方、圆、方"},{label:"圆、圆、方、方"},{label:"圆、方、方、圆"}], answer: 0, hint: "寻找两个动作轮流出现的结构。", explain: "“圆、方”与“拍手、跺脚”都是AB交替规律。" },
    ],
  },
  {
    id: 5, week: 2, title: "规律修理师", subtitle: "找错、修好、再创造", icon: "🛠️",
    color: "#ff8f70", skill: "模式纠错",
    activities: [
      { prompt: "红、红、蓝｜红、蓝、蓝，哪里坏了？", instruction: "规律应该是“红、红、蓝”一直重复", options: [{label:"第4个"},{label:"第5个"},{label:"第6个"}], answer: 1, hint: "正确分组应该是：红红蓝｜红红蓝。", explain: "第5个本来应该是红色。" },
      { prompt: "星、月、月｜星、月、月｜下一组从谁开始？", instruction: "先说出重复单元", options: [{label:"星星",emoji:"⭐"},{label:"月亮",emoji:"🌙"},{label:"太阳",emoji:"☀️"}], answer: 0, hint: "每一组都是“星、月、月”。", explain: "新的一组从星星开始。" },
      { prompt: "哪一个是真正的重复规律？", instruction: "至少要让同一个小单元出现两次", options: [{label:"红蓝｜红蓝"},{label:"红蓝｜蓝红"},{label:"红红｜蓝蓝"}], answer: 0, hint: "竖线两边应该完全一样。", explain: "“红蓝”完整重复了两次。" },
    ],
  },
  {
    id: 6, week: 2, title: "规律设计师", subtitle: "把同一规律换种材料", icon: "🎨",
    color: "#4ba6d8", skill: "模式迁移",
    activities: [
      { prompt: "用声音表示“红、蓝、红、蓝”", instruction: "选出结构完全一样的节奏", options: [{label:"拍手、跺脚、拍手、跺脚"},{label:"拍手、拍手、跺脚、跺脚"},{label:"拍手、跺脚、跺脚、拍手"}], answer: 0, hint: "红和拍手对应，蓝和跺脚对应。", explain: "颜色规律可以迁移成动作规律。" },
      { prompt: "哪个是“一个大、两个小”的重复？", instruction: "寻找ABB结构", options: [{label:"● • •｜● • •"},{label:"● ● •｜● ● •"},{label:"● •｜● •"}], answer: 0, hint: "每组应该先大，再小、小。", explain: "第一项完整重复了“大、小、小”。" },
      { prompt: "规则够清楚吗？", instruction: "选一个别人最容易接下去的设计", options: [{label:"红蓝红蓝红蓝"},{label:"红蓝黄绿紫"},{label:"红红蓝黄绿"}], answer: 0, hint: "好规律要能找到重复的小单元。", explain: "第一个设计的重复单元清楚，别人能预测下一步。" },
    ],
  },
  {
    id: 7, week: 3, title: "一样多吗", subtitle: "给每一位找到伙伴", icon: "🐰",
    color: "#f4b64a", skill: "一一对应",
    activities: [
      { prompt: "3只兔子需要几根胡萝卜？", instruction: "每只兔子一根，不能重复", options: [{label:"2根",emoji:"🥕🥕"},{label:"3根",emoji:"🥕🥕🥕"},{label:"4根",emoji:"🥕🥕🥕🥕"}], answer: 1, hint: "从第一只兔子开始，一只配一根。", explain: "3只兔子和3根胡萝卜一一配对，刚好一样多。" },
      { prompt: "哪一组杯子和4把勺一样多？", instruction: "不要只看排得长不长", options: [{label:"3个杯子"},{label:"4个杯子"},{label:"5个杯子"}], answer: 1, hint: "给每把勺找一个杯子。", explain: "数量都是4，所以一样多。" },
      { prompt: "5辆车只有4个车位，会怎样？", instruction: "一辆车停一个位置", options: [{label:"刚好停满"},{label:"多出1辆车"},{label:"空出1个车位"}], answer: 1, hint: "先让4辆车停进4个车位。", explain: "配完以后还有1辆车，所以车更多。" },
    ],
  },
  {
    id: 8, week: 3, title: "数量变了吗", subtitle: "排法改变，数量不一定变", icon: "✨",
    color: "#8678d8", skill: "数量守恒",
    activities: [
      { prompt: "5颗星排得更开，还是几颗？", instruction: "位置变了，没有增加也没有拿走", options: [{label:"4颗"},{label:"5颗"},{label:"6颗"}], answer: 1, hint: "想想有没有星星加入或离开。", explain: "只是位置改变，数量仍然是5。" },
      { prompt: "两排各有6个点，一排更长，谁更多？", instruction: "可以在脑中一一连线", options: [{label:"长的一排更多"},{label:"短的一排更多"},{label:"一样多"}], answer: 2, hint: "排得更开会显得更长，但点没有变多。", explain: "两排都是6个，所以一样多。" },
      { prompt: "什么情况下数量真的会变？", instruction: "找出有东西加入或离开的情况", options: [{label:"把小球排成一圈"},{label:"把小球放得更开"},{label:"拿走一个小球"}], answer: 2, hint: "哪一个动作让小球不在原来的集合里了？", explain: "拿走一个才会让数量减少。" },
    ],
  },
  {
    id: 9, week: 3, title: "估一估", subtitle: "先猜，再用办法检查", icon: "🔎",
    color: "#56b89f", skill: "估测与验证",
    activities: [
      { prompt: "●●● ●●，大约有几个？", instruction: "先看成3个和2个，不必逐个点", options: [{label:"3"},{label:"5"},{label:"8"}], answer: 1, hint: "左边3个，右边2个，合起来呢？", explain: "3和2合起来是5。" },
      { prompt: "怎样摆8颗豆子，最容易一眼看清？", instruction: "选择有结构的摆法", options: [{label:"随便散开"},{label:"摆成4和4两排"},{label:"全部挤在一起"}], answer: 1, hint: "整齐分组能帮助眼睛快速看清数量。", explain: "4和4的结构比散乱排列更容易识别。" },
      { prompt: "估完以后，怎样知道自己对不对？", instruction: "选择可靠的检查办法", options: [{label:"再猜一次"},{label:"点数或分组验证"},{label:"问它们"}], answer: 1, hint: "好办法要能得到证据。", explain: "估测后用点数、配对或分组检查。" },
    ],
  },
  {
    id: 10, week: 4, title: "红灯绿灯", subtitle: "听清规则再行动", icon: "🚦",
    color: "#ff8f70", skill: "抑制控制",
    activities: [
      { prompt: "普通规则：看到绿灯应该？", instruction: "先在心里说一遍规则", options: [{label:"前进"},{label:"停下"},{label:"转圈"}], answer: 0, hint: "绿灯表示可以通行。", explain: "普通规则下，绿灯前进。" },
      { prompt: "现在是相反日：红灯应该？", instruction: "规则已经交换，别急着按", options: [{label:"前进"},{label:"停下"},{label:"睡觉"}], answer: 0, hint: "相反日里，红灯和绿灯的意思交换。", explain: "新规则下，红灯反而表示前进。" },
      { prompt: "怎样帮助自己不被旧规则骗到？", instruction: "选择一个可用的自我控制方法", options: [{label:"越快越好"},{label:"先说规则，再选择"},{label:"闭着眼睛点"}], answer: 1, hint: "给大脑一点停下来检查的时间。", explain: "先复述规则再行动，能减少冲动错误。" },
    ],
  },
  {
    id: 11, week: 4, title: "线索小屋", subtitle: "两条线索一起想", icon: "🏠",
    color: "#4ba6d8", skill: "条件与排除",
    activities: [
      { prompt: "它是红色的，而且能吃。是谁？", instruction: "答案要同时满足两条线索", options: [{label:"苹果",emoji:"🍎"},{label:"消防车",emoji:"🚒"},{label:"香蕉",emoji:"🍌"}], answer: 0, hint: "先找红色，再检查能不能吃。", explain: "苹果既是红色，又能吃。" },
      { prompt: "它会飞，但不是动物。是谁？", instruction: "用第二条线索排除动物", options: [{label:"小鸟",emoji:"🐦"},{label:"飞机",emoji:"✈️"},{label:"蝴蝶",emoji:"🦋"}], answer: 1, hint: "三者都会飞，哪一个不是动物？", explain: "飞机会飞，而且不是动物。" },
      { prompt: "只说“它是圆的”，能猜出唯一答案吗？", instruction: "判断信息够不够", options: [{label:"能，只有一种圆东西"},{label:"不能，还需要更多线索"},{label:"一定是皮球"}], answer: 1, hint: "生活中圆的东西是不是有很多？", explain: "一条宽泛线索可能对应很多答案，需要更多信息。" },
    ],
  },
  {
    id: 12, week: 4, title: "思维岛庆典", subtitle: "把四种办法连起来", icon: "🏝️",
    color: "#8678d8", skill: "综合迁移",
    activities: [
      { prompt: "先按“能飞”分类，谁能上天空船？", instruction: "记住当前规则", options: [{label:"飞机",emoji:"✈️"},{label:"小鱼",emoji:"🐟"},{label:"小狗",emoji:"🐶"}], answer: 0, hint: "谁可以离开地面，在天空移动？", explain: "飞机符合“能飞”的分类规则。" },
      { prompt: "船帆规律：星、月、星、月，下一块？", instruction: "找出重复单元", options: [{label:"星星",emoji:"⭐"},{label:"月亮",emoji:"🌙"},{label:"太阳",emoji:"☀️"}], answer: 0, hint: "两个一组：星月｜星月｜？", explain: "AB规律再次从星星开始。" },
      { prompt: "4位船员有4份点心，分配结果怎样？", instruction: "每人一份", options: [{label:"刚好一样多"},{label:"多一份点心"},{label:"少一份点心"}], answer: 0, hint: "把每位船员和一份点心连起来。", explain: "4和4可以一一配对，刚好一样多。" },
    ],
  },
];

const initialProgress: Progress = { completed: [], stars: 0, attempts: {} };

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const [activeLesson, setActiveLesson] = useState<Lesson>(LESSONS[0]);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "try" | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("thinking-island-progress");
    if (saved) {
      try { setProgress(JSON.parse(saved)); } catch { /* keep clean state */ }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem("thinking-island-progress", JSON.stringify(progress));
  }, [progress, loaded]);

  const nextLesson = LESSONS.find((lesson) => !progress.completed.includes(lesson.id)) ?? LESSONS[11];
  const completion = Math.round((progress.completed.length / LESSONS.length) * 100);

  const startLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setStep(0);
    setSelected(null);
    setFeedback(null);
    setHintOpen(false);
    setScreen("lesson");
    window.scrollTo(0, 0);
  };

  const answer = (index: number) => {
    if (feedback === "correct") return;
    setSelected(index);
    const isCorrect = index === activeLesson.activities[step].answer;
    setFeedback(isCorrect ? "correct" : "try");
    setProgress((current) => ({
      ...current,
      attempts: { ...current.attempts, [activeLesson.id]: (current.attempts[activeLesson.id] ?? 0) + 1 },
    }));
  };

  const advance = () => {
    if (step < activeLesson.activities.length - 1) {
      setStep((current) => current + 1);
      setSelected(null);
      setFeedback(null);
      setHintOpen(false);
      return;
    }
    const firstCompletion = !progress.completed.includes(activeLesson.id);
    setProgress((current) => ({
      ...current,
      completed: firstCompletion ? [...current.completed, activeLesson.id] : current.completed,
      stars: firstCompletion ? current.stars + 3 : current.stars,
    }));
    setScreen("home");
  };

  const resetProgress = () => {
    setProgress(initialProgress);
    window.localStorage.removeItem("thinking-island-progress");
  };

  if (!loaded) return <div className="loading-screen">正在铺好思维岛的小路…</div>;

  return (
    <main className="app-shell">
      <TopBar
        screen={screen}
        stars={progress.stars}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        goHome={() => { setScreen("home"); setMenuOpen(false); }}
        goParent={() => { setScreen("parent"); setMenuOpen(false); }}
        goReport={() => { setScreen("report"); setMenuOpen(false); }}
      />

      {screen === "home" && (
        <HomeScreen
          nextLesson={nextLesson}
          progress={progress}
          completion={completion}
          startLesson={startLesson}
          openReport={() => setScreen("report")}
        />
      )}

      {screen === "lesson" && (
        <LessonScreen
          lesson={activeLesson}
          step={step}
          selected={selected}
          feedback={feedback}
          hintOpen={hintOpen}
          setHintOpen={setHintOpen}
          answer={answer}
          advance={advance}
          exit={() => setScreen("home")}
        />
      )}

      {screen === "parent" && (
        <ParentScreen
          progress={progress}
          completion={completion}
          resetProgress={resetProgress}
          openReport={() => setScreen("report")}
        />
      )}

      {screen === "report" && (
        <ReportScreen progress={progress} back={() => setScreen("parent")} />
      )}
    </main>
  );
}

function TopBar({ screen, stars, menuOpen, setMenuOpen, goHome, goParent, goReport }: {
  screen: Screen; stars: number; menuOpen: boolean; setMenuOpen: (value: boolean) => void;
  goHome: () => void; goParent: () => void; goReport: () => void;
}) {
  return (
    <header className="topbar">
      <button className="brand" onClick={goHome} aria-label="返回思维岛首页">
        <span className="brand-mark">想</span>
        <span><strong>思维岛</strong><small>每天想一点，办法多一点</small></span>
      </button>
      <div className="top-actions">
        {screen !== "lesson" && <div className="star-pill" aria-label={`拥有${stars}颗星`}>★ {stars}</div>}
        <button className="avatar-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
          <span>🧒🏻</span><i />
        </button>
        {menuOpen && (
          <nav className="profile-menu" aria-label="页面导航">
            <button onClick={goHome}>🏝️ 儿童首页</button>
            <button onClick={goReport}>📊 成长报告</button>
            <button onClick={goParent}>🔐 家长中心</button>
          </nav>
        )}
      </div>
    </header>
  );
}

function HomeScreen({ nextLesson, progress, completion, startLesson, openReport }: {
  nextLesson: Lesson; progress: Progress; completion: number;
  startLesson: (lesson: Lesson) => void; openReport: () => void;
}) {
  return (
    <div className="home-screen">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> 今日探险</div>
          <h1>嗨，小船长！<br /><em>新的思维任务</em>已经准备好</h1>
          <p>今天我们会观察、动手，还要把你的好办法说出来。</p>
          <button className="primary-button" onClick={() => startLesson(nextLesson)}>
            <span>开始第 {nextLesson.id} 课</span><b>→</b>
          </button>
          <div className="time-note">◷ 约 15 分钟 · 完成后休息眼睛</div>
        </div>
        <div className="hero-scene" aria-hidden="true">
          <div className="sun" />
          <div className="cloud cloud-one" />
          <div className="cloud cloud-two" />
          <div className="island">
            <div className="island-icon">{nextLesson.icon}</div>
            <div className="island-label"><small>下一站</small><strong>{nextLesson.title}</strong></div>
          </div>
          <div className="boat">⛵</div>
          <div className="wave wave-one" />
          <div className="wave wave-two" />
        </div>
      </section>

      <section className="progress-strip">
        <div>
          <span className="mini-icon coral">✓</span>
          <p><strong>{progress.completed.length}</strong><small>已完成课程</small></p>
        </div>
        <div>
          <span className="mini-icon gold">★</span>
          <p><strong>{progress.stars}</strong><small>思考星星</small></p>
        </div>
        <div className="wide-progress">
          <p><strong>第一座思维岛</strong><small>{completion}% 完成</small></p>
          <div className="progress-track"><i style={{ width: `${completion}%` }} /></div>
        </div>
        <button onClick={openReport}>查看成长 →</button>
      </section>

      <section className="map-section">
        <div className="section-heading">
          <div><span>首月课程地图</span><h2>四周，十二次小探险</h2></div>
          <p>已完成的课程也可以再次挑战</p>
        </div>
        <div className="lesson-grid">
          {LESSONS.map((lesson) => {
            const done = progress.completed.includes(lesson.id);
            const locked = lesson.id > nextLesson.id + 2 && !done;
            return (
              <button
                key={lesson.id}
                className={`lesson-card ${done ? "done" : ""} ${lesson.id === nextLesson.id ? "current" : ""}`}
                onClick={() => !locked && startLesson(lesson)}
                disabled={locked}
                style={{ "--lesson-color": lesson.color } as React.CSSProperties}
              >
                <span className="lesson-number">{done ? "✓" : lesson.id}</span>
                <span className="lesson-emoji">{locked ? "🔒" : lesson.icon}</span>
                <small>第{lesson.week}周 · 第{((lesson.id - 1) % 3) + 1}课</small>
                <strong>{lesson.title}</strong>
                <em>{lesson.subtitle}</em>
                <i>{done ? "再玩一次" : locked ? "继续前进后解锁" : "开始探索"} →</i>
              </button>
            );
          })}
        </div>
      </section>

      <section className="offline-card">
        <div className="offline-illustration">🥄 <span>·</span> 🥤 <span>·</span> 🥄 <span>·</span> 🥤</div>
        <div><small>今天的离屏游戏</small><h3>用杯子和勺子摆一个规律</h3><p>让孩子创造规律，家长来猜下一件是什么。</p></div>
        <div className="offline-time"><strong>5</strong><span>分钟<br />亲子任务</span></div>
      </section>
    </div>
  );
}

function LessonScreen({ lesson, step, selected, feedback, hintOpen, setHintOpen, answer, advance, exit }: {
  lesson: Lesson; step: number; selected: number | null; feedback: "correct" | "try" | null;
  hintOpen: boolean; setHintOpen: (value: boolean) => void; answer: (index: number) => void;
  advance: () => void; exit: () => void;
}) {
  const activity = lesson.activities[step];
  return (
    <div className="lesson-screen" style={{ "--lesson-color": lesson.color } as React.CSSProperties}>
      <div className="lesson-toolbar">
        <button className="round-button" onClick={exit} aria-label="退出课程">×</button>
        <div className="lesson-progress">
          <small>{lesson.title} · 第 {step + 1} 关</small>
          <div>{lesson.activities.map((_, index) => <i key={index} className={index <= step ? "active" : ""} />)}</div>
        </div>
        <div className="skill-tag">{lesson.icon} {lesson.skill}</div>
      </div>

      <section className="activity-card">
        <div className="guide-row">
          <div className="guide-avatar">🦊</div>
          <div className="speech-bubble">
            <small>听听任务</small>
            <h2>{activity.prompt}</h2>
            <p>{activity.instruction}</p>
          </div>
        </div>

        <div className="options-grid">
          {activity.options.map((option, index) => (
            <button
              key={option.label}
              onClick={() => answer(index)}
              className={`option-card ${selected === index ? "selected" : ""} ${feedback === "correct" && index === activity.answer ? "correct" : ""} ${feedback === "try" && selected === index ? "wrong" : ""}`}
            >
              {option.emoji && <span>{option.emoji}</span>}
              <strong>{option.label}</strong>
              <i>{String.fromCharCode(65 + index)}</i>
            </button>
          ))}
        </div>

        <div className="activity-footer">
          <button className="hint-button" onClick={() => setHintOpen(!hintOpen)}>💡 给我一点提示</button>
          <span>先想一想，再轻轻点答案</span>
        </div>
        {hintOpen && <div className="hint-panel"><b>小提示</b>{activity.hint}</div>}

        {feedback && (
          <div className={`feedback-panel ${feedback}`}>
            <div className="feedback-icon">{feedback === "correct" ? "✓" : "↻"}</div>
            <div>
              <small>{feedback === "correct" ? "发现得真仔细！" : "好办法还藏着呢"}</small>
              <strong>{feedback === "correct" ? activity.explain : "再看一看线索，或者打开提示试试。"}</strong>
            </div>
            {feedback === "correct" && <button onClick={advance}>{step === lesson.activities.length - 1 ? "完成课程" : "下一关"} →</button>}
          </div>
        )}
      </section>
    </div>
  );
}

function ParentScreen({ progress, completion, resetProgress, openReport }: {
  progress: Progress; completion: number; resetProgress: () => void; openReport: () => void;
}) {
  const [showReset, setShowReset] = useState(false);
  const completedLesson = progress.completed.length ? LESSONS[progress.completed.length - 1] : null;
  return (
    <div className="parent-screen">
      <section className="parent-hero">
        <div><span>家长中心</span><h1>下午好，船长家长</h1><p>这里记录思考过程，不用一次表现给孩子贴标签。</p></div>
        <button className="outline-button" onClick={openReport}>查看完整报告 →</button>
      </section>
      <section className="parent-stats">
        <article><small>首月进度</small><strong>{completion}%</strong><div className="progress-track"><i style={{width:`${completion}%`}} /></div></article>
        <article><small>已完成课程</small><strong>{progress.completed.length}<em>/ 12</em></strong><p>每周建议3节</p></article>
        <article><small>累计思考星</small><strong>{progress.stars} ★</strong><p>只奖励完成和坚持</p></article>
      </section>
      <div className="parent-columns">
        <section className="parent-card">
          <div className="card-title"><div><small>最近一次学习</small><h2>{completedLesson?.title ?? "等待第一次探险"}</h2></div><span>{completedLesson?.icon ?? "🌱"}</span></div>
          <div className="observation">
            <b>建议观察</b>
            <p>{completedLesson ? `孩子正在练习“${completedLesson.skill}”。做完后可以问：你从哪里看出来的？` : "从第一课开始，观察孩子能否听完规则后再操作。"}</p>
          </div>
          <ul className="evidence-list">
            <li><span>✓</span><div><strong>不强调速度</strong><small>答题时间不计入能力高低</small></div></li>
            <li><span>✓</span><div><strong>允许再次尝试</strong><small>错误后给线索，不直接公布答案</small></div></li>
            <li><span>✓</span><div><strong>回到真实生活</strong><small>每周安排一个离屏亲子任务</small></div></li>
          </ul>
        </section>
        <section className="parent-card">
          <div className="card-title"><div><small>本周亲子任务</small><h2>玩具的两种分法</h2></div><span>🧸</span></div>
          <ol className="task-steps">
            <li><b>1</b><p>请孩子挑出6–10件不同玩具。</p></li>
            <li><b>2</b><p>让他自己决定一种规则，把玩具分组。</p></li>
            <li><b>3</b><p>问：“还能换一种规则重新分吗？”</p></li>
          </ol>
          <div className="parent-script"><b>推荐说法</b><p>“你注意到了什么？”<br />“你的规则是什么？”<br />“还有别的办法吗？”</p></div>
        </section>
      </div>
      <section className="settings-card">
        <div><small>设备数据</small><h3>学习记录保存在这台设备上</h3><p>这个首版不需要账号，也不会上传儿童照片或录音。</p></div>
        {!showReset ? <button onClick={() => setShowReset(true)}>管理学习记录</button> : <div className="reset-confirm"><span>确定清空全部进度？</span><button onClick={resetProgress}>确认清空</button><button onClick={() => setShowReset(false)}>取消</button></div>}
      </section>
    </div>
  );
}

function ReportScreen({ progress, back }: { progress: Progress; back: () => void }) {
  const domains = useMemo(() => {
    const count = progress.completed.length;
    return [
      { name: "分类与规则", value: Math.min(92, 18 + count * 7), color: "#ff8f70" },
      { name: "模式与关系", value: Math.min(88, 12 + Math.max(0, count - 3) * 10), color: "#f4b64a" },
      { name: "数感与比较", value: Math.min(84, 10 + Math.max(0, count - 6) * 13), color: "#56b89f" },
      { name: "注意与切换", value: Math.min(80, 15 + Math.max(0, count - 8) * 16), color: "#8678d8" },
    ];
  }, [progress.completed.length]);
  return (
    <div className="report-screen">
      <button className="back-link" onClick={back}>← 返回家长中心</button>
      <section className="report-header">
        <div><span>首月成长记录</span><h1>小船长的思考证据</h1><p>下面显示的是本课程中的学习表现，不是智力测评或同龄排名。</p></div>
        <div className="report-badge"><strong>{progress.completed.length}</strong><span>完成课程</span></div>
      </section>
      <div className="report-layout">
        <section className="report-card">
          <div className="report-title"><h2>能力探索进度</h2><small>根据已完成课程估算</small></div>
          <div className="domain-bars">
            {domains.map((domain) => <div key={domain.name}><p><strong>{domain.name}</strong><span>{domain.value}%</span></p><div><i style={{width:`${domain.value}%`, background:domain.color}} /></div></div>)}
          </div>
          <div className="report-note">完成更多不同类型的任务后，能力画像会逐渐清晰。</div>
        </section>
        <section className="report-card">
          <div className="report-title"><h2>学习方式观察</h2><small>给家长的解释</small></div>
          <div className="insight-block good"><span>↗</span><div><strong>当前优势</strong><p>{progress.completed.length >= 4 ? "能够在熟悉结构中发现规律，并愿意重新尝试。" : "正在建立听规则、做选择和说理由的学习流程。"}</p></div></div>
          <div className="insight-block next"><span>→</span><div><strong>下一步</strong><p>{progress.completed.length >= 7 ? "把数量判断迁移到真实物品，并鼓励孩子主动检查。" : "继续练习换规则分类，减少成人直接提示。"}</p></div></div>
          <div className="insight-block home"><span>⌂</span><div><strong>家庭建议</strong><p>每周选一次5分钟离屏任务。先让孩子自己想，再问“怎样检查”。</p></div></div>
        </section>
      </div>
      <section className="milestone-card">
        <div><small>本阶段里程碑</small><h2>第一座思维岛</h2></div>
        {[3,6,9,12].map((point) => <div key={point} className={progress.completed.length >= point ? "reached" : ""}><span>{progress.completed.length >= point ? "✓" : point}</span><p><strong>完成 {point} 课</strong><small>{point === 3 ? "分类与解释" : point === 6 ? "发现与创造模式" : point === 9 ? "数量比较与验证" : "规则切换与综合迁移"}</small></p></div>)}
      </section>
    </div>
  );
}
