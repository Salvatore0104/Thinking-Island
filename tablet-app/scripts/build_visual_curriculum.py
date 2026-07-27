"""Build the 800-level, six-mode Thinking Island curriculum."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path


COLORS = ["#ff8f70", "#f4b64a", "#56b89f", "#4ba6d8", "#8678d8"]
TYPE_COUNTS = {
    "choice": 32,
    "dragSort": 12,
    "dragOrder": 8,
    "match": 10,
    "path": 8,
    "jigsaw": 10,
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


def type_schedule() -> list[str]:
    schedule: list[str] = []
    for cycle in range(8):
        block = ["choice", "dragSort", "choice", "dragOrder", "choice", "match", "path", "choice", "jigsaw"]
        if cycle < 4:
            block.append("dragSort")
        elif cycle < 6:
            block.append("match")
        else:
            block.append("jigsaw")
        schedule.extend(block)
    assert Counter(schedule) == Counter(TYPE_COUNTS)
    return schedule


def common(category_index: int, question_index: int, game_type: str) -> dict:
    category = CATEGORIES[category_index]
    phase = (question_index - 1) // 20 + 1
    type_names = {
        "choice": "图片选择", "dragSort": "分类拖拽", "dragOrder": "规律排列",
        "match": "配对连线", "path": "路径规划", "jigsaw": "八块拼图",
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


def choice_activity(category: dict, variant: int, phase: int) -> dict:
    target_index = (variant + phase) % 2
    target_name, target_items = category["groups"][target_index]
    other_name, other_items = category["groups"][1 - target_index]
    correct = target_items[variant % 4]
    distractors = [other_items[(variant + offset) % 4] for offset in range(3)]
    raw = [correct, *distractors]
    shift = (variant * 3 + phase) % 4
    choices = raw[shift:] + raw[:shift]
    answer = choices.index(correct)
    return {
        "type": "choice",
        "prompt": " ".join(item[1] for item in choices),
        "voicePrompt": f"找出属于{target_name}的图片。",
        "instruction": "👆",
        "visualOnly": True,
        "options": [{"id": f"c-{variant}-{i}", "label": item[0], "emoji": item[1]} for i, item in enumerate(choices)],
        "answer": answer,
        "hint": f"只找{target_name}，先排除{other_name}。",
        "explain": f"{correct[0]}属于{target_name}。",
    }


def drag_sort_activity(category: dict, variant: int, phase: int) -> dict:
    zones = [
        {"id": "zone-a", "label": category["groups"][0][0], "emoji": "🟢"},
        {"id": "zone-b", "label": category["groups"][1][0], "emoji": "🟣"},
    ]
    items = []
    for group_index, (_, group_items) in enumerate(category["groups"]):
        count = 2 if phase == 1 else 3
        for offset in range(count):
            item = group_items[(variant + offset + phase) % 4]
            items.append({
                "id": f"s-{variant}-{group_index}-{offset}",
                "label": item[0],
                "emoji": item[1],
                "target": zones[group_index]["id"],
            })
    items = items[variant % len(items):] + items[:variant % len(items)]
    return {
        "type": "dragSort",
        "prompt": "🧺  ↔  🧺",
        "voicePrompt": f"把图片分别送到{zones[0]['label']}和{zones[1]['label']}的篮子里。",
        "instruction": "🖐️",
        "visualOnly": True,
        "items": items,
        "zones": zones,
        "hint": "一次拿一张，想清楚它属于哪一边。",
        "explain": "所有图片都找到了自己的类别。",
    }


def drag_order_activity(category: dict, variant: int, phase: int) -> dict:
    first = category["groups"][0][1][variant % 4]
    second = category["groups"][1][1][(variant + phase) % 4]
    pattern_length = 4 if phase < 3 else 5
    correct_items = []
    for index in range(pattern_length):
        source = first if index % 2 == 0 else second
        correct_items.append({"id": f"o-{variant}-{index}", "label": source[0], "emoji": source[1]})
    scrambled = correct_items[1::2] + correct_items[::2]
    return {
        "type": "dragOrder",
        "prompt": f"{first[1]} {second[1]} {first[1]} {second[1]}",
        "voicePrompt": "看上面的规律，把下面的图片按同样顺序摆好。",
        "instruction": "🖐️",
        "visualOnly": True,
        "items": scrambled,
        "answerOrder": [item["id"] for item in correct_items],
        "hint": "两个图片轮流出现。",
        "explain": "你复制出了完整的交替规律。",
    }


def match_activity(category: dict, variant: int, phase: int) -> dict:
    pair_count = 3 if phase < 3 else 4
    left = []
    right = []
    pairs = []
    for index in range(pair_count):
        group = category["groups"][index % 2][1]
        item = group[(variant + index) % 4]
        left_id = f"l-{variant}-{index}"
        right_id = f"r-{variant}-{index}"
        left.append({"id": left_id, "label": item[0], "emoji": item[1]})
        right.append({"id": right_id, "label": item[0], "emoji": item[1]})
        pairs.append([left_id, right_id])
    right = right[1:] + right[:1]
    return {
        "type": "match",
        "prompt": "🔗",
        "voicePrompt": "从左边出发，把一样或对应的伙伴连起来。",
        "instruction": "〰️",
        "visualOnly": True,
        "left": left,
        "right": right,
        "pairs": pairs,
        "hint": "先点左边，再找右边完全对应的图片。",
        "explain": "所有伙伴都正确连在一起了。",
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


def path_activity(category: dict, variant: int, phase: int) -> dict:
    size = 4
    solution = PATHS[variant % len(PATHS)]
    candidates = [cell for cell in range(size * size) if cell not in solution and cell not in (0, 15)]
    blocked = candidates[(variant + phase) % len(candidates):] + candidates[:(variant + phase) % len(candidates)]
    blocked = blocked[: min(3 + phase, 6)]
    return {
        "type": "path",
        "prompt": "🐭  ➜  🧀",
        "voicePrompt": "从小老鼠出发，沿着相邻格子走到奶酪，不能碰石头。",
        "instruction": "👆",
        "visualOnly": True,
        "size": size,
        "start": 0,
        "goal": 15,
        "blocked": blocked,
        "solution": solution,
        "hint": "每次只能走到上下左右相邻的一格。",
        "explain": "你找到了一条安全路线。",
    }


def jigsaw_activity(category_index: int, variant: int, phase: int) -> dict:
    scene = variant % 3 + 1
    rows, columns = ((2, 4) if variant % 2 == 0 else (4, 2))
    orders = [
        [3, 0, 6, 1, 7, 4, 2, 5],
        [5, 2, 7, 0, 4, 1, 6, 3],
        [1, 6, 3, 7, 0, 5, 2, 4],
        [6, 4, 0, 5, 2, 7, 3, 1],
        [2, 7, 4, 1, 6, 3, 5, 0],
        [7, 3, 1, 6, 5, 0, 4, 2],
        [4, 1, 5, 2, 0, 6, 3, 7],
        [0, 5, 2, 4, 7, 3, 1, 6],
        [6, 2, 5, 0, 3, 7, 4, 1],
        [2, 4, 7, 3, 1, 5, 0, 6],
    ]
    order = orders[variant % len(orders)]
    return {
        "type": "jigsaw",
        "prompt": "🧩 × 8",
        "voicePrompt": "把八块图片拖回正确位置，拼出完整的思维岛场景。",
        "instruction": "🖐️",
        "visualOnly": True,
        "image": f"/game-scenes/scene-{category_index + 1}-{scene}.webp",
        "rows": rows,
        "columns": columns,
        "order": order,
        "hint": "先找四个角，再观察图案能不能接上。",
        "explain": "八块拼图都回到了正确位置。",
    }


BUILDERS = {
    "choice": choice_activity,
    "dragSort": drag_sort_activity,
    "dragOrder": drag_order_activity,
    "match": match_activity,
}


def build() -> list[dict]:
    levels: list[dict] = []
    signatures: set[str] = set()
    schedule = type_schedule()
    for category_index, category in enumerate(CATEGORIES):
        type_variants: Counter[str] = Counter()
        for question_index, game_type in enumerate(schedule, start=1):
            phase = (question_index - 1) // 20 + 1
            variant = type_variants[game_type]
            type_variants[game_type] += 1
            entry = common(category_index, question_index, game_type)
            if game_type in BUILDERS:
                activity = BUILDERS[game_type](category, variant + category_index * 7, phase)
            elif game_type == "path":
                activity = path_activity(category, variant + category_index, phase)
            else:
                activity = jigsaw_activity(category_index, variant, phase)
            entry["activities"] = [activity]
            signature = json.dumps(
                [category_index, game_type, activity],
                ensure_ascii=False,
                sort_keys=True,
            )
            if signature in signatures:
                raise ValueError(f"Duplicate puzzle signature at category {category_index + 1}, question {question_index}")
            signatures.add(signature)
            levels.append(entry)
        if type_variants != Counter(TYPE_COUNTS):
            raise ValueError(f"Wrong type distribution for {category['skill']}: {type_variants}")
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
