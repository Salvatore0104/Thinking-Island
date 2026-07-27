"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import advancedLessons from "./advanced-lessons.json";

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

const BASE_LESSONS: Lesson[] = [
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
  {
    id: 13, week: 5, title: "长短排队", subtitle: "从最短一直排到最长", icon: "📏",
    color: "#56b89f", skill: "比较与排序",
    activities: [
      { prompt: "哪一支铅笔最长？", instruction: "把它们的一端对齐，再比较另一端", options: [{label:"短铅笔",emoji:"▰"},{label:"长铅笔",emoji:"▰▰▰"},{label:"中铅笔",emoji:"▰▰"}], answer: 1, hint: "起点一样时，伸得最远的最长。", explain: "第二支铅笔伸得最远，所以它最长。" },
      { prompt: "哪一个顺序是从短到长？", instruction: "先找最短的，再找最长的", options: [{label:"短、中、长"},{label:"长、中、短"},{label:"中、短、长"}], answer: 0, hint: "像上楼梯一样，一步比一步长。", explain: "短、中、长的顺序每次都增加一点。" },
      { prompt: "小、中、空、超长，空位放谁？", instruction: "让长度变化保持顺序", options: [{label:"比中更短"},{label:"比中长、比超长短"},{label:"和小的一样长"}], answer: 1, hint: "空位前面是中，后面是超长。", explain: "空位需要一个介于中和超长之间的长度。" },
    ],
  },
  {
    id: 14, week: 5, title: "谁站中间", subtitle: "在有顺序的队伍里插空", icon: "🪜",
    color: "#f4b64a", skill: "序列与插空",
    activities: [
      { prompt: "矮树和高树中间放哪棵？", instruction: "让三棵树从矮到高排好", options: [{label:"更矮的树"},{label:"中等高的树"},{label:"最高的树"}], answer: 1, hint: "中间的树要比矮树高，又比高树矮。", explain: "中等高的树同时满足前后两个条件。" },
      { prompt: "轻、中、重的箱子，谁最后搬？", instruction: "队伍按从轻到重排列", options: [{label:"轻箱子"},{label:"中箱子"},{label:"重箱子"}], answer: 2, hint: "最后一个应该是最重的。", explain: "从轻到重排列时，重箱子在最后。" },
      { prompt: "哪个序列少了一步？", instruction: "观察每次都增加一个圆点", options: [{label:"●｜●●｜●●●"},{label:"●｜●●●｜●●"},{label:"●●｜●｜●●●"}], answer: 0, hint: "数量应该是一、二、三。", explain: "第一列每次增加一个圆点，顺序完整。" },
    ],
  },
  {
    id: 15, week: 5, title: "标准选择师", subtitle: "先说清楚按什么来排", icon: "⚖️",
    color: "#8678d8", skill: "多属性比较",
    activities: [
      { prompt: "大羽毛和小石头，谁更重？", instruction: "大小和重量不是同一件事", options: [{label:"大羽毛"},{label:"小石头"},{label:"一定一样重"}], answer: 1, hint: "不要只看谁占的地方大，想想拿在手里的感觉。", explain: "物体大不一定重，小石头可以比大羽毛更重。" },
      { prompt: "要选最高的积木塔，应该看什么？", instruction: "只选择和高度有关的标准", options: [{label:"颜色"},{label:"顶端离桌面多高"},{label:"用了什么形状"}], answer: 1, hint: "从桌面到塔顶的距离表示高度。", explain: "比较高度要看塔顶离同一起点有多远。" },
      { prompt: "红色短绳和蓝色长绳，按颜色分会怎样？", instruction: "这次不要按长短", options: [{label:"红绳进红色组"},{label:"长绳一定在第一组"},{label:"两条都不能分"}], answer: 0, hint: "当前标准是颜色。", explain: "分类和排序前先明确标准，当前只看颜色。" },
    ],
  },
  {
    id: 16, week: 6, title: "图形名片", subtitle: "用边和角介绍图形", icon: "🔷",
    color: "#4ba6d8", skill: "图形属性",
    activities: [
      { prompt: "哪个图形有三条边、三个角？", instruction: "用手指沿着边走一圈", options: [{label:"三角形",emoji:"🔺"},{label:"正方形",emoji:"🟦"},{label:"圆形",emoji:"🔵"}], answer: 0, hint: "数一数尖尖的角有几个。", explain: "三角形有三条边和三个角。" },
      { prompt: "正方形转个方向，还是正方形吗？", instruction: "方向变了，边和角没有变", options: [{label:"还是正方形"},{label:"变成三角形"},{label:"变成圆形"}], answer: 0, hint: "数一数，仍然有四条一样长的边。", explain: "旋转只改变方向，不改变图形的属性。" },
      { prompt: "哪个图形没有直直的边，也没有角？", instruction: "观察轮廓", options: [{label:"圆形",emoji:"🔵"},{label:"三角形",emoji:"🔺"},{label:"正方形",emoji:"🟩"}], answer: 0, hint: "哪一个可以顺顺地滚动？", explain: "圆形的轮廓是弯曲的，没有角。" },
    ],
  },
  {
    id: 17, week: 6, title: "拼图工坊", subtitle: "小图形可以组成大图形", icon: "🧩",
    color: "#ff8f70", skill: "图形组合",
    activities: [
      { prompt: "两个一样的半圆可以拼成什么？", instruction: "把两条直边靠在一起", options: [{label:"一个圆"},{label:"一个三角形"},{label:"一条线"}], answer: 0, hint: "想象把切开的橙子重新合起来。", explain: "两个匹配的半圆可以合成一个完整的圆。" },
      { prompt: "两个一样的小正方形并排，像什么？", instruction: "观察拼好后的外轮廓", options: [{label:"长方形"},{label:"圆形"},{label:"三角形"}], answer: 0, hint: "拼好后有四个角，两条边更长。", explain: "两个小正方形并排可以组成一个长方形。" },
      { prompt: "两个直角三角形怎样拼成正方形？", instruction: "让最长的斜边贴在一起", options: [{label:"斜边相贴"},{label:"只碰一个角"},{label:"完全分开"}], answer: 0, hint: "找到两条一样长的斜边。", explain: "沿斜边拼合，外轮廓可以成为正方形。" },
    ],
  },
  {
    id: 18, week: 6, title: "一图多拼", subtitle: "同一个目标不止一种办法", icon: "🏗️",
    color: "#56b89f", skill: "空间创造",
    activities: [
      { prompt: "拼一座房子，哪组图形最合适？", instruction: "屋顶需要尖角，房身需要四条边", options: [{label:"三角形和正方形"},{label:"两个圆形"},{label:"一条直线"}], answer: 0, hint: "想一想常见房子的外轮廓。", explain: "三角形可以做屋顶，正方形可以做房身。" },
      { prompt: "想拼出长方形，哪种办法也可以？", instruction: "寻找不同于两个正方形的拼法", options: [{label:"两个匹配的三角形"},{label:"一个圆和一个星星"},{label:"三个分开的点"}], answer: 0, hint: "三角形沿合适的边拼起来，也能得到四边形。", explain: "同一目标可以有不同的图形组合方法。" },
      { prompt: "怎样确认拼图真的完成了？", instruction: "选择可靠的检查方法", options: [{label:"看外轮廓是否填满且不重叠"},{label:"只看颜色好不好看"},{label:"随便放进去"}], answer: 0, hint: "检查有没有空洞，也有没有压在一起。", explain: "完整拼图应填满轮廓，不留空也不重叠。" },
    ],
  },
  {
    id: 19, week: 7, title: "一眼看几", subtitle: "不逐个数也能看出小数量", icon: "🎲",
    color: "#f4b64a", skill: "小数量识别",
    activities: [
      { prompt: "骰子上四个角都有点，一共有几个？", instruction: "把它看成一个熟悉的图案", options: [{label:"3"},{label:"4"},{label:"5"}], answer: 1, hint: "左上、右上、左下、右下各一个。", explain: "四个角各有一点，一眼可以看出是四。" },
      { prompt: "上面两个点，下面三个点，合起来几个？", instruction: "先分组看，再合起来", options: [{label:"4"},{label:"5"},{label:"6"}], answer: 1, hint: "两个和三个合起来。", explain: "二和三合起来是五。" },
      { prompt: "哪种摆法最容易一眼看出六？", instruction: "寻找整齐、熟悉的结构", options: [{label:"三和三排成两行"},{label:"六个点挤成一团"},{label:"六个点随便散开"}], answer: 0, hint: "整齐分成两组更容易看清。", explain: "三和三的结构能帮助我们快速识别六。" },
    ],
  },
  {
    id: 20, week: 7, title: "数字找朋友", subtitle: "把数字符号和数量配起来", icon: "🔢",
    color: "#8678d8", skill: "数符号对应",
    activities: [
      { prompt: "数字5应该和哪一组做朋友？", instruction: "数量必须刚好是五", options: [{label:"⭐⭐⭐⭐⭐"},{label:"⭐⭐⭐⭐"},{label:"⭐⭐⭐⭐⭐⭐"}], answer: 0, hint: "可以把星星分成二和三。", explain: "五颗星与数字五表示同一个数量。" },
      { prompt: "四辆车应该找到哪张数字卡？", instruction: "每辆车对应一个数", options: [{label:"3"},{label:"4"},{label:"5"}], answer: 1, hint: "一辆一辆点数，最后说到几？", explain: "四辆车对应数字四。" },
      { prompt: "数字0表示什么？", instruction: "想象盘子里的饼干全部拿走", options: [{label:"一个也没有"},{label:"还有一个"},{label:"有十个"}], answer: 0, hint: "空盘子里还剩几个？", explain: "零表示集合里一个也没有。" },
    ],
  },
  {
    id: 21, week: 7, title: "数量变装秀", subtitle: "同一个数可以有很多样子", icon: "🎭",
    color: "#4ba6d8", skill: "数量多表征",
    activities: [
      { prompt: "三只猫、三声鼓、三个点，有什么相同？", instruction: "材料不同，关注数量", options: [{label:"数量都是3"},{label:"声音都相同"},{label:"颜色都相同"}], answer: 0, hint: "分别数一数有几个。", explain: "东西、声音和点虽然不同，都可以表示数量三。" },
      { prompt: "哪一种也能表示五？", instruction: "寻找不同的五个一组", options: [{label:"两只手举出五根手指"},{label:"四块积木"},{label:"六下拍手"}], answer: 0, hint: "最后要刚好数到五。", explain: "五根手指也是数量五的一种表示。" },
      { prompt: "把五个点排成一圈，数量会怎样？", instruction: "只改变位置，不增加也不拿走", options: [{label:"仍然是5"},{label:"变成6"},{label:"变成4"}], answer: 0, hint: "有没有新的点加入？", explain: "排列方式改变，数量仍然是五。" },
    ],
  },
  {
    id: 22, week: 8, title: "记忆快递", subtitle: "记住两步再行动", icon: "📦",
    color: "#ff8f70", skill: "工作记忆",
    activities: [
      { prompt: "先拿苹果，再拿香蕉。第一个是什么？", instruction: "在心里把两步按顺序说一遍", options: [{label:"苹果",emoji:"🍎"},{label:"香蕉",emoji:"🍌"},{label:"橙子",emoji:"🍊"}], answer: 0, hint: "指令开头说的是哪种水果？", explain: "第一步拿苹果，第二步才拿香蕉。" },
      { prompt: "把球放进盒子，再关上盖子。最后一步是什么？", instruction: "想象动作连续发生", options: [{label:"关上盖子"},{label:"拿出球"},{label:"打开盒子"}], answer: 0, hint: "球已经放好，接下来要做什么？", explain: "两步指令的最后一步是关上盖子。" },
      { prompt: "拍手、摸头、再拍手，中间动作是什么？", instruction: "记住三个动作的位置", options: [{label:"拍手"},{label:"摸头"},{label:"跺脚"}], answer: 1, hint: "第一个和最后一个相同，中间不同。", explain: "三个动作中，摸头排在中间。" },
    ],
  },
  {
    id: 23, week: 8, title: "藏在哪里", subtitle: "记住位置和移动", icon: "🎁",
    color: "#56b89f", skill: "空间工作记忆",
    activities: [
      { prompt: "礼物藏在左边杯子下面，应该选哪边？", instruction: "先记住位置词，再行动", options: [{label:"左边"},{label:"右边"},{label:"中间"}], answer: 0, hint: "伸出左手帮自己确认。", explain: "指令说礼物在左边杯子下面。" },
      { prompt: "小球从中间移到右边，现在在哪里？", instruction: "追踪移动后的新位置", options: [{label:"左边"},{label:"中间"},{label:"右边"}], answer: 2, hint: "不要回答开始的位置，要回答移动以后。", explain: "小球最后移动到右边。" },
      { prompt: "星星原来在上面，向下移动一格，会到哪里？", instruction: "在脑中跟着它移动", options: [{label:"下面"},{label:"更上面"},{label:"左边"}], answer: 0, hint: "方向是向下。", explain: "从上面向下移动，会到较下面的位置。" },
    ],
  },
  {
    id: 24, week: 8, title: "记忆规则站", subtitle: "一边记住，一边换规则", icon: "🧠",
    color: "#8678d8", skill: "记忆与规则整合",
    activities: [
      { prompt: "记住规则：看到水果拍手。苹果出现时应该？", instruction: "先复述规则，再选择动作", options: [{label:"拍手"},{label:"跺脚"},{label:"不动"}], answer: 0, hint: "苹果属于水果。", explain: "苹果符合水果规则，所以应该拍手。" },
      { prompt: "新规则：看到红色跺脚。蓝色圆形出现时应该？", instruction: "旧规则已经不用了", options: [{label:"跺脚"},{label:"不跺脚"},{label:"拍两次手"}], answer: 1, hint: "现在只看颜色，它是不是红色？", explain: "当前规则是看到红色才跺脚，蓝色不符合。" },
      { prompt: "先摸头，再看到圆形拍手。应该按什么顺序？", instruction: "同时记住动作顺序和条件", options: [{label:"摸头，再拍手"},{label:"拍手，再摸头"},{label:"只拍手"}], answer: 0, hint: "先完成固定动作，再执行圆形规则。", explain: "正确顺序是先摸头，看到圆形后再拍手。" },
    ],
  },
];

const LESSONS: Lesson[] = BASE_LESSONS.map((lesson) => {
  const advanced = advancedLessons.find((item) => item.id === lesson.id);
  return advanced ? { ...lesson, activities: advanced.activities as Activity[] } : lesson;
});

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
  const [voiceOn, setVoiceOn] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("thinking-island-progress");
    if (saved) {
      try { setProgress(JSON.parse(saved)); } catch { /* keep clean state */ }
    }
    const savedVoice = window.localStorage.getItem("thinking-island-voice");
    if (savedVoice !== null) setVoiceOn(savedVoice === "on");
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem("thinking-island-progress", JSON.stringify(progress));
  }, [progress, loaded]);

  const playFiles = (files: string[], playWhenMuted = false) => {
    if (!voiceOn && !playWhenMuted) return;
    audioRef.current?.pause();
    let index = 0;
    const playNext = () => {
      if (index >= files.length) return;
      const audio = new Audio(`/audio/${files[index]}`);
      index += 1;
      audio.volume = 0.88;
      audioRef.current = audio;
      audio.onended = playNext;
      audio.play().catch(() => { /* A visible replay button remains available. */ });
    };
    playNext();
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    window.localStorage.setItem("thinking-island-voice", next ? "on" : "off");
    if (!next) {
      audioRef.current?.pause();
    } else {
      playFiles(["welcome.mp3"], true);
    }
  };

  const nextLesson = LESSONS.find((lesson) => !progress.completed.includes(lesson.id)) ?? LESSONS[LESSONS.length - 1];
  const completion = Math.round((progress.completed.length / LESSONS.length) * 100);

  const startLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setStep(0);
    setSelected(null);
    setFeedback(null);
    setHintOpen(false);
    setScreen("lesson");
    window.scrollTo(0, 0);
    playFiles([
      `lesson-${String(lesson.id).padStart(2, "0")}-intro.mp3`,
      `lesson-${String(lesson.id).padStart(2, "0")}-step-01-prompt.mp3`,
    ]);
  };

  const answer = (index: number) => {
    if (feedback === "correct") return;
    setSelected(index);
    const isCorrect = index === activeLesson.activities[step].answer;
    setFeedback(isCorrect ? "correct" : "try");
    playFiles([
      isCorrect
        ? `lesson-${String(activeLesson.id).padStart(2, "0")}-step-${String(step + 1).padStart(2, "0")}-correct.mp3`
        : "try-again.mp3",
    ]);
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
      playFiles([
        `lesson-${String(activeLesson.id).padStart(2, "0")}-step-${String(step + 2).padStart(2, "0")}-prompt.mp3`,
      ]);
      return;
    }
    const firstCompletion = !progress.completed.includes(activeLesson.id);
    setProgress((current) => ({
      ...current,
      completed: firstCompletion ? [...current.completed, activeLesson.id] : current.completed,
      stars: firstCompletion ? current.stars + 3 : current.stars,
    }));
    playFiles(["lesson-complete.mp3"]);
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
        voiceOn={voiceOn}
        toggleVoice={toggleVoice}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        goHome={() => { audioRef.current?.pause(); setScreen("home"); setMenuOpen(false); }}
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
          replayWelcome={() => playFiles(["welcome.mp3"])}
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
          exit={() => { audioRef.current?.pause(); setScreen("home"); }}
          voiceOn={voiceOn}
          playFiles={playFiles}
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

function TopBar({ screen, stars, voiceOn, toggleVoice, menuOpen, setMenuOpen, goHome, goParent, goReport }: {
  screen: Screen; stars: number; voiceOn: boolean; toggleVoice: () => void;
  menuOpen: boolean; setMenuOpen: (value: boolean) => void;
  goHome: () => void; goParent: () => void; goReport: () => void;
}) {
  return (
    <header className="topbar">
      <button className="brand" onClick={goHome} aria-label="返回思维岛首页">
        <span className="brand-mark">想</span>
        <span><strong>思维岛</strong><small>每天想一点，办法多一点</small></span>
      </button>
      <div className="top-actions">
        <button className={`voice-toggle ${voiceOn ? "on" : ""}`} onClick={toggleVoice} aria-label={voiceOn ? "关闭语音引导" : "开启语音引导"}>
          <span>{voiceOn ? "🔊" : "🔇"}</span><b>{voiceOn ? "语音开" : "语音关"}</b>
        </button>
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

function HomeScreen({ nextLesson, progress, completion, startLesson, openReport, replayWelcome }: {
  nextLesson: Lesson; progress: Progress; completion: number;
  startLesson: (lesson: Lesson) => void; openReport: () => void; replayWelcome: () => void;
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
          <button className="welcome-audio" onClick={replayWelcome}>🔊 听一听今天的任务</button>
          <div className="time-note">◷ 约 15 分钟 · 全程柔和语音引导 · 完成后休息眼睛</div>
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
          <p><strong>第一阶段 · 观察与关系</strong><small>{completion}% 完成</small></p>
          <div className="progress-track"><i style={{ width: `${completion}%` }} /></div>
        </div>
        <button onClick={openReport}>查看成长 →</button>
      </section>

      <section className="map-section">
        <div className="section-heading">
          <div><span>阶段课程地图</span><h2>八周，二十四次小探险</h2></div>
          <p>全部关卡已开放 · 第5周起进入进阶挑战</p>
        </div>
        <div className="lesson-grid">
          {LESSONS.map((lesson) => {
            const done = progress.completed.includes(lesson.id);
            return (
              <button
                key={lesson.id}
                className={`lesson-card ${done ? "done" : ""} ${lesson.id === nextLesson.id ? "current" : ""}`}
                onClick={() => startLesson(lesson)}
                style={{ "--lesson-color": lesson.color } as React.CSSProperties}
              >
                <span className="lesson-number">{done ? "✓" : lesson.id}</span>
                <span className="lesson-emoji">{lesson.icon}</span>
                <small>
                  第{lesson.week}周 · 第{((lesson.id - 1) % 3) + 1}课
                  {lesson.id >= 13 ? " · 进阶" : ""}
                </small>
                <strong>{lesson.title}</strong>
                <em>{lesson.subtitle}</em>
                <i>{done ? "再玩一次" : "开始探索"} →</i>
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

function LessonScreen({ lesson, step, selected, feedback, hintOpen, setHintOpen, answer, advance, exit, voiceOn, playFiles }: {
  lesson: Lesson; step: number; selected: number | null; feedback: "correct" | "try" | null;
  hintOpen: boolean; setHintOpen: (value: boolean) => void; answer: (index: number) => void;
  advance: () => void; exit: () => void; voiceOn: boolean; playFiles: (files: string[]) => void;
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
            <button
              className="replay-button"
              onClick={() => playFiles([
                `lesson-${String(lesson.id).padStart(2, "0")}-step-${String(step + 1).padStart(2, "0")}-prompt.mp3`,
              ])}
              aria-label="重新播放任务语音"
            >
              {voiceOn ? "🔊 再听一遍" : "🔇 请先开启语音"}
            </button>
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
          <button className="hint-button" onClick={() => {
            const opening = !hintOpen;
            setHintOpen(opening);
            if (opening) {
              playFiles([
                `lesson-${String(lesson.id).padStart(2, "0")}-step-${String(step + 1).padStart(2, "0")}-hint.mp3`,
              ]);
            }
          }}>💡 给我一点提示</button>
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
  const completedLesson = progress.completed.length
    ? LESSONS.find((lesson) => lesson.id === Math.max(...progress.completed)) ?? null
    : null;
  return (
    <div className="parent-screen">
      <section className="parent-hero">
        <div><span>家长中心</span><h1>下午好，船长家长</h1><p>这里记录思考过程，不用一次表现给孩子贴标签。</p></div>
        <button className="outline-button" onClick={openReport}>查看完整报告 →</button>
      </section>
      <section className="parent-stats">
        <article><small>阶段进度</small><strong>{completion}%</strong><div className="progress-track"><i style={{width:`${completion}%`}} /></div></article>
        <article><small>已完成课程</small><strong>{progress.completed.length}<em>/ {LESSONS.length}</em></strong><p>每周建议3节</p></article>
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
        <div><span>阶段成长记录</span><h1>小船长的思考证据</h1><p>下面显示的是本课程中的学习表现，不是智力测评或同龄排名。</p></div>
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
        <div><small>本阶段里程碑</small><h2>观察与关系岛</h2></div>
        {[6,12,18,24].map((point) => <div key={point} className={progress.completed.length >= point ? "reached" : ""}><span>{progress.completed.length >= point ? "✓" : point}</span><p><strong>完成 {point} 课</strong><small>{point === 6 ? "分类与模式" : point === 12 ? "数量与规则切换" : point === 18 ? "排序与图形组合" : "数感与工作记忆"}</small></p></div>)}
      </section>
    </div>
  );
}
