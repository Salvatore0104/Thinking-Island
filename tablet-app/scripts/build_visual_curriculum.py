"""Build the 800-level, six-mode Thinking Island curriculum."""

from __future__ import annotations

import json
import itertools
from collections import Counter
from pathlib import Path


COLORS = ["#ff8f70", "#f4b64a", "#56b89f", "#4ba6d8", "#8678d8"]
TYPE_COUNTS = {
    "choice": 34,
    "dragSort": 14,
    "dragOrder": 10,
    "match": 10,
    "path": 8,
    "jigsaw": 4,
}

CATEGORIES = [
    {
        "skill": "分类与排除", "icon": "🧺",
        "groups": [
            ("水果", [("苹果", "🍎"), ("香蕉", "🍌"), ("草莓", "🍓"), ("葡萄", "🍇")]),
            ("交通工具", [("汽车", "🚗"), ("公交车", "🚌"), ("火车", "🚂"), ("飞机", "✈️")]),
        ],
    },
    {
        "skill": "规律与纠错", "icon": "🪄",
        "groups": [
            ("暖色图形", [("红圆", "🔴"), ("黄圆", "🟡"), ("橙心", "🧡"), ("黄星", "⭐")]),
            ("冷色图形", [("蓝圆", "🔵"), ("绿圆", "🟢"), ("蓝方", "🟦"), ("绿方", "🟩")]),
        ],
    },
    {
        "skill": "类比与关系", "icon": "🔗",
        "groups": [
            ("白天出现", [("太阳", "☀️"), ("彩虹", "🌈"), ("向日葵", "🌻"), ("蝴蝶", "🦋")]),
            ("夜晚出现", [("月亮", "🌙"), ("星星", "⭐"), ("猫头鹰", "🦉"), ("手电筒", "🔦")]),
        ],
    },
    {
        "skill": "比较与排序", "icon": "📏",
        "groups": [
            ("较小", [("蚂蚁", "🐜"), ("瓢虫", "🐞"), ("蜗牛", "🐌"), ("蜜蜂", "🐝")]),
            ("较大", [("大象", "🐘"), ("长颈鹿", "🦒"), ("鲸鱼", "🐋"), ("河马", "🦛")]),
        ],
    },
    {
        "skill": "空间与路径", "icon": "🧭",
        "groups": [
            ("地面", [("小屋", "🏠"), ("树木", "🌳"), ("汽车", "🚙"), ("帐篷", "⛺")]),
            ("天空", [("云朵", "☁️"), ("飞机", "✈️"), ("火箭", "🚀"), ("卫星", "🛰️")]),
        ],
    },
    {
        "skill": "数量与数感", "icon": "🔢",
        "groups": [
            ("一到四", [("一个", "●"), ("两个", "●●"), ("三个", "●●●"), ("四个", "●●●●")]),
            ("五到八", [("五个", "★★★★★"), ("六个", "●●●\n●●●"), ("七个", "🍒🍒🍒🍒🍒🍒🍒"), ("八个", "🐟🐟🐟🐟🐟🐟🐟🐟")]),
        ],
    },
    {
        "skill": "图形与组合", "icon": "🧩",
        "groups": [
            ("圆润图形", [("圆形", "⭕"), ("椭圆", "🥚"), ("圆环", "🛟"), ("月牙", "🌙")]),
            ("有角图形", [("三角", "🔺"), ("方形", "🟦"), ("菱形", "🔶"), ("星形", "⭐")]),
        ],
    },
    {
        "skill": "工作记忆", "icon": "🧠",
        "groups": [
            ("动作", [("拍手", "👏"), ("跺脚", "🦶"), ("摸头", "🙆"), ("挥手", "👋")]),
            ("物品", [("苹果", "🍎"), ("小球", "⚽"), ("礼物", "🎁"), ("钥匙", "🔑")]),
        ],
    },
    {
        "skill": "规则与控制", "icon": "🚦",
        "groups": [
            ("可以行动", [("绿灯", "🟢"), ("向前", "⬆️"), ("开始", "▶️"), ("通过", "✅")]),
            ("需要停下", [("红灯", "🔴"), ("暂停", "⏸️"), ("禁止", "⛔"), ("等待", "⏳")]),
        ],
    },
    {
        "skill": "综合逻辑", "icon": "🧠",
        "groups": [
            ("自然伙伴", [("苹果", "🍎"), ("小鸟", "🐦"), ("太阳", "☀️"), ("花朵", "🌼")]),
            ("探险工具", [("地图", "🗺️"), ("钥匙", "🔑"), ("手电筒", "🔦"), ("背包", "🎒")]),
        ],
    },
]

# Version 4 uses four genuinely different content families per ability instead
# of repeating two opposing buckets.  Each family supplies its own vocabulary,
# analogy relations and sequence material; builders below vary the reasoning
# rule by phase rather than merely rotating answer positions.
def item(label: str, emoji: str) -> tuple[str, str]:
    return label, emoji


RICH_CATEGORIES = [
    {
        "skill": "分类与排除", "icon": "🧺",
        "groups": [
            ("水果", [item("苹果", "🍎"), item("香蕉", "🍌"), item("草莓", "🍓"), item("葡萄", "🍇")]),
            ("交通工具", [item("汽车", "🚗"), item("公交车", "🚌"), item("火车", "🚆"), item("飞机", "✈️")]),
            ("动物", [item("小狗", "🐶"), item("小猫", "🐱"), item("兔子", "🐰"), item("小鸟", "🐦")]),
            ("工具", [item("锤子", "🔨"), item("剪刀", "✂️"), item("钥匙", "🔑"), item("手电筒", "🔦")]),
        ],
        "relations": [
            (item("苹果", "🍎"), item("果篮", "🧺")), (item("汽车", "🚗"), item("车库", "🏠")),
            (item("小鸟", "🐦"), item("鸟窝", "🪹")), (item("锤子", "🔨"), item("钉子", "📌")),
            (item("香蕉", "🍌"), item("果盘", "🍽️")), (item("火车", "🚆"), item("车站", "🚉")),
            (item("兔子", "🐰"), item("胡萝卜", "🥕")), (item("钥匙", "🔑"), item("门锁", "🔒")),
        ],
    },
    {
        "skill": "规律与纠错", "icon": "🪄",
        "groups": [
            ("暖色图形", [item("红圆", "🔴"), item("黄圆", "🟡"), item("橙心", "🧡"), item("黄星", "⭐")]),
            ("冷色图形", [item("蓝圆", "🔵"), item("绿圆", "🟢"), item("蓝方", "🟦"), item("绿方", "🟩")]),
            ("天气符号", [item("太阳", "☀️"), item("云朵", "☁️"), item("雨滴", "💧"), item("雪花", "❄️")]),
            ("方向符号", [item("向上", "⬆️"), item("向右", "➡️"), item("向下", "⬇️"), item("向左", "⬅️")]),
        ],
        "relations": [
            (item("红圆", "🔴"), item("蓝圆", "🔵")), (item("黄圆", "🟡"), item("绿圆", "🟢")),
            (item("太阳", "☀️"), item("云朵", "☁️")), (item("雨滴", "💧"), item("雪花", "❄️")),
            (item("向上", "⬆️"), item("向下", "⬇️")), (item("向左", "⬅️"), item("向右", "➡️")),
            (item("黄星", "⭐"), item("蓝方", "🟦")), (item("橙心", "🧡"), item("绿方", "🟩")),
        ],
    },
    {
        "skill": "类比与关系", "icon": "🔗",
        "groups": [
            ("白天出现", [item("太阳", "☀️"), item("彩虹", "🌈"), item("向日葵", "🌻"), item("蝴蝶", "🦋")]),
            ("夜晚出现", [item("月亮", "🌙"), item("星星", "⭐"), item("猫头鹰", "🦉"), item("手电筒", "🔦")]),
            ("动物", [item("小鸟", "🐦"), item("蜜蜂", "🐝"), item("小狗", "🐶"), item("兔子", "🐰")]),
            ("住所", [item("鸟窝", "🪹"), item("蜂巢", "🐝"), item("狗屋", "🏠"), item("兔洞", "🕳️")]),
        ],
        "relations": [
            (item("小鸟", "🐦"), item("鸟窝", "🪹")), (item("蜜蜂", "🐝"), item("蜂巢", "🍯")),
            (item("小狗", "🐶"), item("狗屋", "🏠")), (item("兔子", "🐰"), item("兔洞", "🕳️")),
            (item("脚", "🦶"), item("鞋子", "👟")), (item("手", "✋"), item("手套", "🧤")),
            (item("牙齿", "🦷"), item("牙刷", "🪥")), (item("头", "🙂"), item("帽子", "🧢")),
        ],
    },
    {
        "skill": "比较与排序", "icon": "📏",
        "groups": [
            ("小动物", [item("蚂蚁", "🐜"), item("瓢虫", "🐞"), item("蜗牛", "🐌"), item("蜜蜂", "🐝")]),
            ("大动物", [item("大象", "🐘"), item("长颈鹿", "🦒"), item("鲸鱼", "🐋"), item("河马", "🦛")]),
            ("轻物品", [item("羽毛", "🪶"), item("树叶", "🍃"), item("纸张", "📄"), item("气球", "🎈")]),
            ("重物品", [item("石头", "🪨"), item("汽车", "🚗"), item("冰箱", "🧊"), item("哑铃", "🏋️")]),
        ],
        "relations": [
            (item("蚂蚁", "🐜"), item("大象", "🐘")), (item("瓢虫", "🐞"), item("长颈鹿", "🦒")),
            (item("羽毛", "🪶"), item("石头", "🪨")), (item("气球", "🎈"), item("哑铃", "🏋️")),
            (item("一颗星", "⭐"), item("四颗星", "⭐⭐⭐⭐")), (item("两圆点", "●●"), item("五圆点", "●●●●●")),
            (item("短铅笔", "✏️"), item("长尺子", "📏")), (item("小杯", "🥛"), item("大桶", "🪣")),
        ],
    },
    {
        "skill": "空间与路径", "icon": "🧭",
        "groups": [
            ("天空", [item("云朵", "☁️"), item("飞机", "✈️"), item("火箭", "🚀"), item("卫星", "🛰️")]),
            ("地面", [item("小屋", "🏠"), item("树木", "🌳"), item("汽车", "🚗"), item("帐篷", "⛺")]),
            ("向左", [item("左箭头", "⬅️"), item("左上", "↖️"), item("左转", "↩️"), item("左手", "👈")]),
            ("向右", [item("右箭头", "➡️"), item("右上", "↗️"), item("右转", "↪️"), item("右手", "👉")]),
        ],
        "relations": [
            (item("小鸟", "🐦"), item("天空", "☁️")), (item("小鱼", "🐟"), item("水里", "🌊")),
            (item("汽车", "🚗"), item("道路", "🛣️")), (item("火车", "🚆"), item("铁轨", "🛤️")),
            (item("上面", "⬆️"), item("下面", "⬇️")), (item("左边", "⬅️"), item("右边", "➡️")),
            (item("里面", "📥"), item("外面", "📤")), (item("起点", "🚩"), item("终点", "🏁")),
        ],
    },
    {
        "skill": "数量与数感", "icon": "🔢",
        "groups": [
            ("一到四", [item("一个", "●"), item("两个", "●●"), item("三个", "●●●"), item("四个", "●●●●")]),
            ("五到八", [item("五个", "★★★★★"), item("六个", "●●●\n●●●"), item("七个", "🍒🍒🍒🍒🍒🍒🍒"), item("八个", "🐟🐟🐟🐟🐟🐟🐟🐟")]),
            ("奇数", [item("一", "1️⃣"), item("三", "3️⃣"), item("五", "5️⃣"), item("七", "7️⃣")]),
            ("偶数", [item("二", "2️⃣"), item("四", "4️⃣"), item("六", "6️⃣"), item("八", "8️⃣")]),
        ],
        "relations": [
            (item("一个点", "●"), item("数字一", "1️⃣")), (item("两个点", "●●"), item("数字二", "2️⃣")),
            (item("三个点", "●●●"), item("数字三", "3️⃣")), (item("四个点", "●●●●"), item("数字四", "4️⃣")),
            (item("五颗星", "★★★★★"), item("数字五", "5️⃣")), (item("六个点", "●●●\n●●●"), item("数字六", "6️⃣")),
            (item("七个", "🍒🍒🍒🍒🍒🍒🍒"), item("数字七", "7️⃣")), (item("八个", "🐟🐟🐟🐟🐟🐟🐟🐟"), item("数字八", "8️⃣")),
        ],
    },
    {
        "skill": "图形与组合", "icon": "🧩",
        "groups": [
            ("圆形物品", [item("太阳", "☀️"), item("球", "⚽"), item("钟表", "🕐"), item("圆环", "⭕")]),
            ("有角图形", [item("三角形", "🔺"), item("正方形", "🟦"), item("菱形", "🔶"), item("星形", "⭐")]),
            ("生活物品", [item("门", "🚪"), item("披萨", "🍕"), item("风筝", "🪁"), item("窗户", "🪟")]),
            ("基本图形", [item("长方形", "▭"), item("三角形", "▲"), item("菱形", "◆"), item("正方形", "■")]),
        ],
        "relations": [
            (item("球", "⚽"), item("圆形", "●")), (item("门", "🚪"), item("长方形", "▭")),
            (item("披萨片", "🍕"), item("三角形", "▲")), (item("风筝", "🪁"), item("菱形", "◆")),
            (item("窗户", "🪟"), item("正方形", "■")), (item("鸡蛋", "🥚"), item("椭圆形", "⬭")),
            (item("屋顶", "🏠"), item("三角轮廓", "🔺")), (item("车轮", "🛞"), item("圆环", "⭕")),
        ],
    },
    {
        "skill": "工作记忆", "icon": "🧠",
        "groups": [
            ("动作", [item("拍手", "👏"), item("跳跃", "🦘"), item("点头", "🙆"), item("挥手", "👋")]),
            ("物品", [item("苹果", "🍎"), item("小球", "⚽"), item("礼物", "🎁"), item("钥匙", "🔑")]),
            ("动物", [item("小猫", "🐱"), item("小狗", "🐶"), item("兔子", "🐰"), item("小鸟", "🐦")]),
            ("颜色", [item("红色", "🔴"), item("黄色", "🟡"), item("蓝色", "🔵"), item("绿色", "🟢")]),
        ],
        "relations": [
            (item("拍手", "👏"), item("红色", "🔴")), (item("跳跃", "🦘"), item("黄色", "🟡")),
            (item("点头", "🙆"), item("蓝色", "🔵")), (item("挥手", "👋"), item("绿色", "🟢")),
            (item("小猫", "🐱"), item("苹果", "🍎")), (item("小狗", "🐶"), item("小球", "⚽")),
            (item("兔子", "🐰"), item("礼物", "🎁")), (item("小鸟", "🐦"), item("钥匙", "🔑")),
        ],
    },
    {
        "skill": "规则与控制", "icon": "🚦",
        "groups": [
            ("立即行动", [item("绿灯", "🟢"), item("出发", "▶️"), item("通过", "✅"), item("向前", "⬆️")]),
            ("停下等待", [item("红灯", "🔴"), item("暂停", "⏸️"), item("禁止", "⛔"), item("等待", "⏳")]),
            ("改变方向", [item("左转", "↩️"), item("右转", "↪️"), item("掉头", "🔄"), item("绕行", "🔀")]),
            ("注意观察", [item("黄灯", "🟡"), item("慢行", "🐢"), item("小心", "⚠️"), item("看看", "👀")]),
        ],
        "relations": [
            (item("绿灯", "🟢"), item("前进", "⬆️")), (item("红灯", "🔴"), item("停下", "✋")),
            (item("黄灯", "🟡"), item("慢一点", "🐢")), (item("左转牌", "↩️"), item("向左", "⬅️")),
            (item("右转牌", "↪️"), item("向右", "➡️")), (item("下雨", "🌧️"), item("拿伞", "☂️")),
            (item("天黑", "🌙"), item("开灯", "💡")), (item("手脏", "👐"), item("洗手", "🧼")),
        ],
    },
    {
        "skill": "综合逻辑", "icon": "🧠",
        "groups": [
            ("自然伙伴", [item("苹果", "🍎"), item("小鸟", "🐦"), item("太阳", "☀️"), item("花朵", "🌼")]),
            ("探险工具", [item("地图", "🗺️"), item("钥匙", "🔑"), item("手电筒", "🔦"), item("背包", "🎒")]),
            ("食物", [item("面包", "🍞"), item("牛奶", "🥛"), item("鸡蛋", "🥚"), item("奶酪", "🧀")]),
            ("交通工具", [item("汽车", "🚗"), item("轮船", "🚢"), item("火车", "🚆"), item("飞机", "✈️")]),
        ],
        "relations": [
            (item("下雨", "🌧️"), item("雨伞", "☂️")), (item("迷路", "❓"), item("地图", "🗺️")),
            (item("黑暗", "🌙"), item("手电筒", "🔦")), (item("门锁", "🔒"), item("钥匙", "🔑")),
            (item("小鸟", "🐦"), item("天空", "☁️")), (item("轮船", "🚢"), item("海洋", "🌊")),
            (item("火车", "🚆"), item("铁轨", "🛤️")), (item("飞机", "✈️"), item("机场", "🛫")),
        ],
    },
]

CATEGORIES = RICH_CATEGORIES


def type_schedule() -> list[str]:
    early = [
        "choice", "dragSort", "choice", "dragOrder", "choice",
        "match", "choice", "path", "choice", "dragSort",
        "choice", "dragOrder", "choice", "match", "choice",
        "path", "choice", "dragSort", "dragOrder", "jigsaw",
    ]
    advanced = [
        "choice", "dragSort", "choice", "match", "choice",
        "dragOrder", "choice", "path", "choice", "dragSort",
        "choice", "match", "choice", "dragSort", "choice",
        "path", "dragOrder", "match", "dragSort", "jigsaw",
    ]
    schedule = early + early + advanced + advanced
    assert Counter(schedule) == Counter(TYPE_COUNTS)
    return schedule


def common(category_index: int, question_index: int, game_type: str) -> dict:
    category = CATEGORIES[category_index]
    phase = (question_index - 1) // 20 + 1
    type_names = {
        "choice": "图片选择", "dragSort": "分类拖拽", "dragOrder": "规律排列",
        "match": "配对连线", "path": "路径规划", "jigsaw": "图形拼图",
    }
    return {
        "id": category_index * 80 + question_index,
        "week": (question_index - 1) // 4 + 1,
        "title": type_names[game_type],
        "subtitle": f"能力岛 {category_index + 1} · 第{question_index}题",
        "icon": category["icon"],
        "color": COLORS[category_index % len(COLORS)],
        "skill": category["skill"],
        "categoryIndex": category_index + 1,
        "questionIndex": question_index,
        "phase": phase,
        "activities": [],
    }


def memory_choice_activity(category: dict, variant: int, phase: int) -> dict:
    pool = [candidate for _, candidates in category["groups"] for candidate in candidates]
    length = phase + 2
    start = (variant * 3) % len(pool)
    preview = [pool[(start + offset * 5) % len(pool)] for offset in range(length)]
    if phase == 1:
        correct = preview[0]
        voice = "记住这些图片。它们盖住以后，找出第一张图片。"
        concept = "记住第一项"
    elif phase == 2:
        correct = preview[-1]
        voice = "记住这些图片和顺序。盖住以后，找出最后一张图片。"
        concept = "记住末尾项"
    elif phase == 3:
        correct = preview[1]
        voice = "记住这些图片和顺序。盖住以后，找出第二张图片。"
        concept = "位置工作记忆"
    else:
        correct = next(candidate for candidate in pool if candidate not in preview)
        voice = "记住出现过的图片。盖住以后，找出刚才没有出现的那一张。"
        concept = "反向工作记忆"
    distractor_pool = [candidate for candidate in pool if candidate != correct]
    if phase == 4:
        distractors = preview[:3]
    else:
        distractors = [distractor_pool[(variant + offset * 3) % len(distractor_pool)] for offset in range(3)]
    raw = [correct, *distractors]
    # Repair a rare duplicate caused by wrapped deterministic selection.
    seen = {correct}
    for index in range(1, len(raw)):
        if raw[index] in seen:
            raw[index] = next(candidate for candidate in distractor_pool if candidate not in seen)
        seen.add(raw[index])
    shift = (variant + phase) % 4
    options = raw[shift:] + raw[:shift]
    return {
        "type": "choice",
        "concept": concept,
        "reasoningSteps": phase,
        "prompt": "👀  →  🙈  →  ❓",
        "voicePrompt": voice,
        "instruction": "👆",
        "visualOnly": True,
        "memoryPreview": "  ".join(candidate[1] for candidate in preview),
        "memoryPreviewMs": 3200 + phase * 450,
        "options": [{"id": f"m-{variant}-{index}", "label": candidate[0], "emoji": candidate[1]} for index, candidate in enumerate(options)],
        "answer": options.index(correct),
        "hint": "先在心里把看到的图片说一遍，再选择。",
        "explain": "你把刚才看到的内容留在了脑海里。",
    }


def choice_activity(category: dict, variant: int, phase: int) -> dict:
    if category["skill"] == "工作记忆":
        return memory_choice_activity(category, variant, phase)
    groups = category["groups"]
    local = variant
    target_index = (local // 4 + phase) % len(groups)
    target_name, target_items = groups[target_index]
    if phase == 1:
        correct = target_items[local % 4]
        distractors = [groups[(target_index + offset) % 4][1][(local + offset) % 4] for offset in range(1, 4)]
        voice = f"找出属于{target_name}的图片。"
        hint = f"想一想每件东西是做什么的，只选{target_name}。"
        prompt = "👂  🔎  ❓"
        concept = "单一属性归类"
    elif phase == 2:
        correct = groups[(target_index + 1) % 4][1][local % 4]
        distractors = [target_items[(local + offset) % 4] for offset in range(3)]
        voice = "三张图片是一家，找出不一样的那一张。"
        hint = f"先找三张图片的共同点：它们都是{target_name}。"
        prompt = "👀  👀  👀  ≠  ❓"
        concept = "异类排除"
    elif phase == 3:
        correct = target_items[(local + 2) % 4]
        distractors = [groups[(target_index + offset) % 4][1][(local + offset) % 4] for offset in range(1, 4)]
        examples = [target_items[local % 4], target_items[(local + 1) % 4]]
        voice = f"{examples[0][0]}和{examples[1][0]}是一组。再找一个同一组的伙伴。"
        hint = f"先说出前两张图片的共同点：它们都属于{target_name}。"
        prompt = f"{examples[0][1]}  {examples[1][1]}  +  ❓"
        concept = "从例子推断规则"
    else:
        relations = category["relations"]
        pair_a = relations[local % len(relations)]
        pair_b = relations[(local + 3) % len(relations)]
        correct = pair_b[1]
        distractors = [relations[(local + offset) % len(relations)][1] for offset in (1, 2, 4)]
        voice = f"{pair_a[0][0]}和{pair_a[1][0]}是一对。{pair_b[0][0]}应该和谁配成同样的关系？"
        hint = "先想清楚第一对为什么在一起，再把同样的关系用到第二对。"
        prompt = f"{pair_a[0][1]} : {pair_a[1][1]}  =  {pair_b[0][1]} : ❓"
        concept = "关系类比迁移"
    raw = [correct, *distractors]
    shift = (variant * 3 + phase) % 4
    choices = raw[shift:] + raw[:shift]
    answer = choices.index(correct)
    return {
        "type": "choice",
        "concept": concept,
        "reasoningSteps": phase,
        "prompt": prompt,
        "voicePrompt": voice,
        "instruction": "👆",
        "visualOnly": True,
        "options": [{"id": f"c-{variant}-{i}", "label": item[0], "emoji": item[1]} for i, item in enumerate(choices)],
        "answer": answer,
        "hint": hint,
        "explain": f"答案是{correct[0]}。你找到了这道题真正的规则。",
    }


def drag_sort_activity(category: dict, variant: int, phase: int) -> dict:
    group_count = 2 if phase < 3 else 3
    start = variant % len(category["groups"])
    selected_groups = [category["groups"][(start + offset) % len(category["groups"])] for offset in range(group_count)]
    zones = [{
        "id": f"zone-{index}",
        "label": group[0],
        "emoji": group[1][(variant + index) % 4][1],
    } for index, group in enumerate(selected_groups)]
    items = []
    for group_index, (_, group_items) in enumerate(selected_groups):
        count = 2 if phase <= 2 else 3
        for offset in range(count):
            selected = group_items[(variant + offset + phase + group_index) % 4]
            items.append({
                "id": f"s-{variant}-{group_index}-{offset}",
                "label": selected[0],
                "emoji": selected[1],
                "target": zones[group_index]["id"],
            })
    shift = (variant * 2 + phase) % len(items)
    items = items[shift:] + items[:shift]
    zone_names = "、".join(zone["label"] for zone in zones)
    return {
        "type": "dragSort",
        "concept": "多属性分类" if phase >= 3 else "按共同属性分类",
        "reasoningSteps": phase,
        "prompt": "  ↔  ".join("🧺" for _ in zones),
        "voicePrompt": f"先观察共同点，再把图片分别送到{zone_names}的篮子里。",
        "instruction": "🖐️",
        "visualOnly": True,
        "items": items,
        "zones": zones,
        "hint": "不要只看颜色，想一想每张图片属于哪一类。",
        "explain": f"你同时完成了{group_count}种分类规则。",
    }


def drag_order_activity(category: dict, variant: int, phase: int) -> dict:
    if category["skill"] in {"比较与排序", "数量与数感"}:
        if category["skill"] == "数量与数感":
            ordered_pool = category["groups"][0][1] + category["groups"][1][1]
            prompt = "●  →  ●●  →  ●●●  →  …"
            voice = "比较每组图片的数量，从最少开始，按从少到多的顺序摆好。"
            concept = "数量递增排序"
        else:
            ordered_pools = [
                [item("蚂蚁", "🐜"), item("瓢虫", "🐞"), item("兔子", "🐰"), item("小狗", "🐶"), item("河马", "🦛"), item("大象", "🐘")],
                [item("小勺", "🥄"), item("小杯", "🥛"), item("饭碗", "🥣"), item("水桶", "🪣"), item("浴缸", "🛁"), item("泳池", "🏊")],
            ]
            ordered_pool = ordered_pools[variant % len(ordered_pools)]
            prompt = "🤏  →  📏  →  👐"
            voice = (
                "两两比较，找出最小的动物放在前面，按从小到大的顺序摆好。"
                if variant % 2 == 0
                else "想一想哪个容器装得最少，按容量从少到多的顺序摆好。"
            )
            concept = "大小排序" if variant % 2 == 0 else "容量排序"
        length = min(2 + phase, len(ordered_pool))
        max_start = len(ordered_pool) - length
        if category["skill"] == "数量与数感":
            start = variant % (max_start + 1) if max_start else 0
        else:
            start = (variant // 2) % (max_start + 1) if max_start else 0
        ordered = ordered_pool[start:start + length]
        correct_items = [
            {"id": f"rank-{variant}-{index}", "label": candidate[0], "emoji": candidate[1]}
            for index, candidate in enumerate(ordered)
        ]
        scrambled = correct_items[1::2] + correct_items[::2]
        return {
            "type": "dragOrder",
            "concept": concept,
            "reasoningSteps": phase,
            "prompt": prompt,
            "voicePrompt": voice,
            "instruction": "🖐️",
            "visualOnly": True,
            "items": scrambled,
            "answerOrder": [candidate["id"] for candidate in correct_items],
            "hint": "先只比较两个，选出应该排在最前面的，再比较剩下的。",
            "explain": "你用逐个比较的方法完成了有顺序的排列。",
        }
    first = category["groups"][variant % 4][1][variant % 4]
    second = category["groups"][(variant + 1) % 4][1][(variant + phase) % 4]
    third = category["groups"][(variant + 2) % 4][1][(variant + 2) % 4]
    rules = {
        1: [first, second, first, second],
        2: [first, first, second, first, first, second],
        3: [first, second, third, first, second, third],
        4: [first, second, second, third, first, second, second, third],
    }
    sequence = rules[phase]
    correct_items = [
        {"id": f"o-{variant}-{index}", "label": source[0], "emoji": source[1]}
        for index, source in enumerate(sequence)
    ]
    preview_count = 2 if phase == 1 else 3 if phase < 4 else 4
    scrambled = correct_items[::2] + correct_items[1::2]
    return {
        "type": "dragOrder",
        "concept": ["AB交替", "AAB重复", "ABC循环", "ABBC复合规律"][phase - 1],
        "reasoningSteps": phase,
        "prompt": " ".join(source[1] for source in sequence[:preview_count]) + "  …",
        "voicePrompt": "先找出重复的小组，再把整段规律补完整。",
        "memoryPreview": " ".join(source[1] for source in sequence) if category["skill"] == "工作记忆" else None,
        "memoryPreviewMs": 3500 + phase * 500 if category["skill"] == "工作记忆" else None,
        "instruction": "🖐️",
        "visualOnly": True,
        "items": scrambled,
        "answerOrder": [item["id"] for item in correct_items],
        "hint": f"每{preview_count}个图片里藏着一个会重复的小组。",
        "explain": "你不是照着摆，而是找到了重复规则。",
    }


def match_activity(category: dict, variant: int, phase: int) -> dict:
    pair_count = 3 if phase < 3 else 4
    relations = category["relations"]
    left = []
    right = []
    pairs = []
    for index in range(pair_count):
        relation = relations[(variant * 2 + index) % len(relations)]
        left_id = f"l-{variant}-{index}"
        right_id = f"r-{variant}-{index}"
        left.append({"id": left_id, "label": relation[0][0], "emoji": relation[0][1]})
        right.append({"id": right_id, "label": relation[1][0], "emoji": relation[1][1]})
        pairs.append([left_id, right_id])
    shift = variant % (pair_count - 1) + 1
    right = right[shift:] + right[:shift]
    return {
        "type": "match",
        "concept": ["类别关系", "伙伴与住所", "功能关系", "原因与结果"][phase - 1],
        "reasoningSteps": phase,
        "prompt": "🔍  〰️  💡",
        "voicePrompt": "不要找一模一样的图片。想清楚它们的关系，把真正对应的伙伴连起来。",
        "instruction": "〰️",
        "visualOnly": True,
        "left": left,
        "right": right,
        "pairs": pairs,
        "hint": "先用一句话说出左边图片需要什么，再去右边寻找。",
        "explain": "所有连线都有清楚的关系理由。",
    }


PATHS = [
    [0, 1, 2, 3, 7, 11, 15],
    [0, 4, 8, 9, 10, 11, 15],
    [0, 1, 5, 9, 13, 14, 15],
    [0, 4, 5, 6, 10, 14, 15],
    [0, 1, 5, 6, 7, 11, 15],
    [0, 4, 8, 12, 13, 14, 15],
    [0, 1, 2, 6, 10, 14, 15],
    [0, 4, 5, 9, 13, 14, 15],
]

PATHS_5 = [
    [0, 1, 2, 3, 4, 9, 14, 19, 24],
    [0, 5, 10, 15, 20, 21, 22, 23, 24],
    [4, 3, 2, 7, 12, 17, 22, 21, 20],
    [20, 15, 10, 11, 12, 13, 14, 9, 4],
    [0, 5, 6, 7, 8, 13, 18, 19, 24],
    [4, 9, 8, 7, 12, 17, 16, 21, 20],
    [20, 21, 16, 11, 12, 13, 8, 3, 4],
    [24, 19, 18, 17, 12, 7, 6, 5, 0],
]


def path_activity(category: dict, variant: int, phase: int) -> dict:
    size = 4 if phase <= 2 else 5
    path_bank = PATHS if size == 4 else PATHS_5
    solution = path_bank[variant % len(path_bank)]
    start, goal = solution[0], solution[-1]
    candidates = [cell for cell in range(size * size) if cell not in solution and cell not in (start, goal)]
    obstacle_count = min(2 + phase, 6)
    combinations = list(itertools.combinations(candidates, obstacle_count))
    blocked = list(combinations[(variant // len(path_bank)) % len(combinations)])
    route_names = ["避开障碍", "比较两条路线", "提前规划转弯", "寻找更少步骤"]
    return {
        "type": "path",
        "concept": route_names[phase - 1],
        "reasoningSteps": phase,
        "prompt": "🐭  ➜  🧀",
        "voicePrompt": "先用眼睛看完整条路，再从小老鼠出发。只能走相邻格，不能碰石头。",
        "instruction": "👆",
        "visualOnly": True,
        "size": size,
        "start": start,
        "goal": goal,
        "blocked": blocked,
        "solution": solution,
        "hint": "先从终点倒着找，看看哪一条路能够接回起点。",
        "explain": "你先规划再行动，找到了一条安全路线。",
    }


def jigsaw_activity(category_index: int, variant: int, phase: int) -> dict:
    scene = variant % 3 + 1
    rows = columns = 2 if phase <= 2 else 3
    piece_count = rows * columns
    order = list(range(piece_count))
    shift = (variant * 3 + category_index + phase) % piece_count
    order = order[shift:] + order[:shift]
    if variant % 2:
        order.reverse()
    return {
        "type": "jigsaw",
        "concept": "局部与整体视觉组合",
        "reasoningSteps": phase,
        "prompt": f"🧩 × {piece_count}",
        "voicePrompt": f"把{piece_count}块图片拖回正确位置，拼出完整的思维岛场景。",
        "instruction": "🖐️",
        "visualOnly": True,
        "image": f"/game-scenes/scene-{category_index + 1}-{scene}.webp",
        "rows": rows,
        "columns": columns,
        "order": order,
        "hint": "先看边缘和突起，再观察图案能不能接上。",
        "explain": f"{piece_count}块拼图都回到了正确位置。",
    }


BUILDERS = {
    "choice": choice_activity,
    "dragSort": drag_sort_activity,
    "dragOrder": drag_order_activity,
    "match": match_activity,
}

def semantic_signature(activity: dict) -> str:
    game_type = activity["type"]
    if game_type == "choice":
        answer = activity["options"][activity["answer"]]
        payload = [
            game_type, activity["concept"], activity["prompt"], activity["voicePrompt"],
            activity.get("memoryPreview"),
            sorted(option["emoji"] for option in activity["options"]), answer["emoji"],
        ]
    elif game_type == "dragSort":
        zone_labels = {zone["id"]: zone["label"] for zone in activity["zones"]}
        payload = [
            game_type, activity["concept"],
            sorted((candidate["emoji"], zone_labels[candidate["target"]]) for candidate in activity["items"]),
        ]
    elif game_type == "dragOrder":
        by_id = {candidate["id"]: candidate["emoji"] for candidate in activity["items"]}
        payload = [game_type, activity["concept"], activity["prompt"], [by_id[key] for key in activity["answerOrder"]]]
    elif game_type == "match":
        left = {candidate["id"]: candidate["emoji"] for candidate in activity["left"]}
        right = {candidate["id"]: candidate["emoji"] for candidate in activity["right"]}
        payload = [game_type, activity["concept"], sorted((left[a], right[b]) for a, b in activity["pairs"])]
    elif game_type == "path":
        payload = [
            game_type, activity["size"], activity["start"], activity["goal"],
            sorted(activity["blocked"]), activity["solution"],
        ]
    else:
        payload = [game_type, activity["image"], activity["rows"], activity["columns"]]
    return json.dumps(payload, ensure_ascii=False, sort_keys=True)


def build() -> list[dict]:
    levels: list[dict] = []
    schedule = type_schedule()
    for category_index, category in enumerate(CATEGORIES):
        signatures: set[str] = set()
        type_variants: Counter[str] = Counter()
        concepts: Counter[str] = Counter()
        for question_index, game_type in enumerate(schedule, start=1):
            phase = (question_index - 1) // 20 + 1
            variant = type_variants[game_type]
            type_variants[game_type] += 1
            entry = common(category_index, question_index, game_type)
            if game_type in BUILDERS:
                activity = BUILDERS[game_type](category, variant + category_index * 7, phase)
            elif game_type == "path":
                activity = path_activity(category, variant + category_index * 8, phase)
            else:
                activity = jigsaw_activity(category_index, variant, phase)
            activity["contentSignature"] = semantic_signature(activity)
            entry["activities"] = [activity]
            signature = activity["contentSignature"]
            if signature in signatures:
                raise ValueError(f"Duplicate puzzle signature at category {category_index + 1}, question {question_index}")
            signatures.add(signature)
            concepts[activity["concept"]] += 1
            levels.append(entry)
        if type_variants != Counter(TYPE_COUNTS):
            raise ValueError(f"Wrong type distribution for {category['skill']}: {type_variants}")
        if len(concepts) < 14:
            raise ValueError(f"Too few reasoning concepts for {category['skill']}: {concepts}")
    if len(levels) != 800:
        raise ValueError(f"Expected 800 levels, got {len(levels)}")
    return levels


LEVELS = build()
output_path = Path(__file__).resolve().parents[1] / "app" / "visual-levels.json"
output_path.write_text(
    json.dumps(LEVELS, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(f"wrote {len(LEVELS)} six-mode levels to {output_path}")
